import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { type Database, type TaskType } from '@/types/database'

async function getAuthenticatedShadchan() {
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
  if (!user) return { user: null, profileId: null, error: 'Unauthorized' }

  const { data: row } = await callerClient.from('users').select('role').eq('id', user.id).maybeSingle()
  if ((row as { role: string } | null)?.role !== 'shadchan') return { user: null, profileId: null, error: 'Forbidden' }

  return { user, error: null }
}

export async function POST(request: Request) {
  const { user, error } = await getAuthenticatedShadchan()
  if (!user) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 })

  const adminClient = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (adminClient.from('shadchan_profiles') as any)
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle() as { data: { id: string } | null }

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const body = await request.json() as {
    title: string
    type: TaskType
    due_date: string
    notes?: string
    single_id?: string
  }

  if (!body.title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

  const validTypes: TaskType[] = ['follow_up', 'date_scheduled', 'on_hold', 'note', 'other']
  if (!validTypes.includes(body.type)) return NextResponse.json({ error: 'Invalid type' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: newTask, error: dbError } = await (adminClient.from('calendar_tasks') as any)
    .insert({
      shadchan_id: profile.id,
      title: body.title.trim(),
      type: body.type,
      due_date: body.due_date,
      notes: body.notes ?? null,
      single_id: body.single_id ?? null,
      status: 'pending',
    })
    .select('id, title, type, due_date, status, notes, single_id')
    .single() as { data: { id: string; title: string; type: string; due_date: string; status: string; notes: string | null; single_id: string | null } | null; error: unknown }

  if (dbError) return NextResponse.json({ error: (dbError as { message: string }).message }, { status: 500 })
  return NextResponse.json(newTask)
}
