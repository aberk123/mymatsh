import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@supabase/ssr'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { checkRateLimit, rateLimitResponse } from '@/lib/utils/rate-limit'

const MAX_BYTES = 10 * 1024 * 1024 // 10 MB
const ALLOWED_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
const BUCKET = 'resumes'

const PARSE_PROMPT = `You are parsing an Orthodox Jewish shidduch resume. Extract all information into a structured JSON object.

Extract these fields if present:
- first_name (string)
- last_name (string)
- full_hebrew_name (string)
- gender (string: "male" or "female")
- dob (string: ISO format YYYY-MM-DD if full date present)
- age (integer if only age mentioned)
- birth_month (string)
- city (string)
- state (string)
- height_inches (integer: convert all formats to total inches)
- current_yeshiva_seminary (string)
- previous_yeshivos (string: comma separated)
- eretz_yisroel (string: yeshiva or seminary in Israel if mentioned)
- plans (string: learning/work plans)
- hashkafa (string)
- about_me (string: personal description)
- looking_for (string: what they want in a match)
- family_background (string)
- father_name (string)
- father_occupation (string)
- mother_name (string)
- mother_occupation (string: maiden name if present)
- siblings (string: list of siblings with ages and status)
- references (string: list of references with names and phone numbers)
- phone (string)
- email (string)
- occupation (string: if working)
- raw_notes (string: anything that could not be assigned to a specific field — never discard information)

Rules:
- Common abbreviations: EY = Eretz Yisroel, BMG = Beth Medrash Govoha, BP = Boro Park
- Height formats like "5'9", "5 9", "69 inches" all convert to total inches
- Never invent information not present in the resume
- If a field is not present return null
- Return ONLY valid JSON with no explanation, no markdown, no code fences`

async function getAuthUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: Request) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const resumeLimit = parseInt(process.env.RATE_LIMIT_RESUME_PER_DAY ?? '10', 10)
  const rl = await checkRateLimit(user.id, 'singles/parse-resume', resumeLimit, 86_400_000)
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs!)

  let formData: FormData
  try {
    formData = await request.formData()
  } catch (err) {
    console.error('[parse-resume] failed to parse formData:', err)
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('resume') as File | null
  if (!file) return NextResponse.json({ error: 'No resume file provided' }, { status: 400 })

  console.log(`[parse-resume] received file: name="${file.name}" type="${file.type}" size=${file.size}`)

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: `Invalid file type "${file.type}". Only PDF, JPG, PNG and WebP are supported.` },
      { status: 400 }
    )
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large. Maximum size is 10 MB.' }, { status: 400 })
  }

  let arrayBuffer: ArrayBuffer
  try {
    arrayBuffer = await file.arrayBuffer()
  } catch (err) {
    console.error('[parse-resume] failed to read file buffer:', err)
    return NextResponse.json({ error: 'Failed to read uploaded file.' }, { status: 500 })
  }

  const base64 = Buffer.from(arrayBuffer).toString('base64')
  const isPdf = file.type === 'application/pdf'

  console.log(`[parse-resume] encoded base64 length=${base64.length} isPdf=${isPdf}`)

  const admin = serviceClient()

  // Check if this authenticated user owns a singles record
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: single } = await (admin.from('singles') as any)
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle() as { data: { id: string } | null }

  // Upload to storage and update resume_url (only when a singles record exists)
  let resumeUrl: string | null = null
  if (single) {
    const ext = isPdf ? 'pdf' : file.type === 'image/png' ? 'png' : 'jpg'
    const storagePath = `${user.id}/resume.${ext}`

    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(storagePath, arrayBuffer, { contentType: file.type, upsert: true })

    if (uploadError) {
      console.error('[parse-resume] storage upload error:', uploadError)
    } else {
      const { data: { publicUrl } } = admin.storage.from(BUCKET).getPublicUrl(storagePath)
      resumeUrl = publicUrl
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin.from('singles') as any).update({ resume_url: resumeUrl }).eq('id', single.id)
    }
  }

  const model = process.env.AI_RESUME_MODEL ?? process.env.AI_PARSE_MODEL ?? 'claude-sonnet-4-5'
  const maxTokens = parseInt(process.env.AI_RESUME_MAX_TOKENS ?? '2000', 10)

  console.log(`[parse-resume] calling Claude model="${model}" maxTokens=${maxTokens}`)

  // Build content blocks — document for PDFs, image for raster files
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const content: any[] = isPdf
    ? [
        {
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: base64 },
        },
        { type: 'text', text: PARSE_PROMPT },
      ]
    : [
        {
          type: 'image',
          source: { type: 'base64', media_type: file.type, data: base64 },
        },
        { type: 'text', text: PARSE_PROMPT },
      ]

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  try {
    // DocumentBlockParam is part of the stable messages API in SDK ≥ 0.30
    const response = await anthropic.messages.create(
      { model, max_tokens: maxTokens, messages: [{ role: 'user', content }] }
    )

    console.log(`[parse-resume] tokens in=${response.usage.input_tokens} out=${response.usage.output_tokens} model=${model}`)

    const raw = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('')

    console.log(`[parse-resume] raw response snippet: ${raw.slice(0, 120)}`)

    // Strip any markdown code fences Claude might add despite instructions
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

    let fields: Record<string, unknown>
    try {
      fields = JSON.parse(cleaned)
    } catch (parseErr) {
      console.error('[parse-resume] JSON parse failed:', parseErr)
      console.error('[parse-resume] cleaned snippet:', cleaned.slice(0, 400))
      return NextResponse.json({ error: 'Could not parse resume — Claude returned malformed JSON.' }, { status: 500 })
    }

    console.log(`[parse-resume] successfully parsed ${Object.keys(fields).length} fields`)

    return NextResponse.json({ fields, resumeUrl })
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      const msg = `Anthropic API error ${err.status} (${err.name}): ${err.message}`
      console.error(`[parse-resume] ${msg}`, JSON.stringify(err.error ?? ''))
      return NextResponse.json({ error: msg }, { status: 500 })
    }
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[parse-resume] unexpected error:', err)
    return NextResponse.json({ error: `Resume parsing error: ${msg}` }, { status: 500 })
  }
}
