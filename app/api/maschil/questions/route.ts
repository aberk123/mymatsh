import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { type Database } from '@/types/database'

async function getAuthenticatedMaschil() {
  const cookieStore = await cookies()
  const callerClient = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch { /* ignore */ }
        },
      },
    }
  )
  const { data: { user } } = await callerClient.auth.getUser()
  if (!user) return { user: null, error: 'Unauthorized' }

  const { data: row } = await callerClient.from('users').select('role').eq('id', user.id).maybeSingle()
  if ((row as { role: string } | null)?.role !== 'maschil') return { user: null, error: 'Forbidden' }

  return { user, error: null }
}

export async function GET() {
  const { user, error } = await getAuthenticatedMaschil()
  if (!user) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 })

  const adminClient = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error: dbError } = await (adminClient.from('profile_questions') as any)
    .select('id, question, is_active, created_at')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false }) as {
      data: Array<{ id: string; question: string; is_active: boolean; created_at: string }> | null
      error: unknown
    }

  if (dbError) return NextResponse.json({ error: (dbError as { message: string }).message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const { user, error } = await getAuthenticatedMaschil()
  if (!user) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 })

  const adminClient = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const body = await request.json() as { question: string; is_active?: boolean }
  if (!body.question?.trim()) return NextResponse.json({ error: 'Question is required' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: newQ, error: dbError } = await (adminClient.from('profile_questions') as any)
    .insert({ question: body.question.trim(), is_active: body.is_active ?? true, created_by: user.id })
    .select('id, question, is_active, created_at')
    .single() as { data: { id: string; question: string; is_active: boolean; created_at: string } | null; error: unknown }

  if (dbError) return NextResponse.json({ error: (dbError as { message: string }).message }, { status: 500 })
  return NextResponse.json(newQ)
}
