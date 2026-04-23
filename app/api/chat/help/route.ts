import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/database'

async function requireAuth() {
  const cookieStore = await cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cs) { try { cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch { /* */ } },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

const SYSTEM_PROMPT = `You are the MyMatSH Help Assistant — a friendly, concise assistant that helps shadchanim and admins use the MyMatSH shidduch platform.

You can only answer questions about how to use the MyMatSH platform. If asked anything outside of platform usage — including general shidduch advice, personal questions, or unrelated topics — politely say: "I'm only able to help with questions about using the MyMatSH platform. Is there something about the platform I can help you with?"

The user is currently on this page: {{CURRENT_PAGE_URL}}
The user's role is: {{USER_ROLE}}

MyMatSH platform knowledge:
- Shadchanim can manage their singles under the My Singles tab and browse all singles under All Singles
- Singles can be added manually via the Add Single form or imported in bulk via CSV or Evernote HTML zip upload
- Matches/suggestions are created from the Matches page by selecting a boy and a girl
- Labels are private per shadchan and can be created and assigned to singles from the single's profile page
- Notes added to a single are private to the shadchan who wrote them
- The calendar shows tasks and follow-ups tied to specific singles or matches
- Messages can be sent to singles, parents, and advocates from the Messages page
- Representation requests are managed under Represent Requests
- The admin panel manages shadchan approvals, singles status, organizations, and import batches
- Evernote HTML files can be imported in bulk via Admin → Import Batches → New Import
- Import batches go through a review and approval process before going live
- The shadchan review link is generated from the import batch detail page and sent to the shadchan manually
- The duplicate detection system automatically merges records when the same single appears twice

Always be concise — aim for 2-4 sentences per answer. Use numbered steps when explaining a process. Be friendly and encouraging.`

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      console.error('[HelpChat] ANTHROPIC_API_KEY is not set in environment variables. Add it to .env.local.')
      return NextResponse.json({ error: 'Chat service is not configured (missing API key)' }, { status: 503 })
    }

    let body: { messages: Array<{ role: 'user' | 'assistant'; content: string }>; currentUrl: string; userRole: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    if (!Array.isArray(body.messages)) {
      return NextResponse.json({ error: 'messages array required' }, { status: 400 })
    }

    const model = process.env.AI_CHAT_MODEL ?? 'claude-sonnet-4-5'
    const maxTokens = parseInt(process.env.AI_CHAT_MAX_TOKENS ?? '500', 10)
    const maxHistory = parseInt(process.env.AI_CHAT_MAX_HISTORY ?? '10', 10)

    const systemPrompt = SYSTEM_PROMPT
      .replace('{{CURRENT_PAGE_URL}}', body.currentUrl ?? 'unknown')
      .replace('{{USER_ROLE}}', body.userRole ?? 'unknown')

    // Trim history server-side before calling Claude
    const messages = body.messages.slice(-maxHistory)

    const client = new Anthropic({ apiKey })

    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages,
    })

    const text = response.content
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; text: string }).text)
      .join('')

    if (process.env.NODE_ENV === 'development') {
      console.log(`[HelpChat] in=${response.usage.input_tokens} out=${response.usage.output_tokens} model=${model}`)
    }

    return NextResponse.json({
      message: text,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    })
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[HelpChat] API error:', err)
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
