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

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { user, error } = await getAuthenticatedMaschil()
  if (!user) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 })

  const adminClient = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (adminClient.from('profile_questions') as any)
    .select('created_by')
    .eq('id', params.id)
    .maybeSingle() as { data: { created_by: string } | null }

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.created_by !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json() as Record<string, unknown>
  const allowed = ['question', 'is_active']
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: dbError } = await (adminClient.from('profile_questions') as any)
    .update(updates)
    .eq('id', params.id)

  if (dbError) return NextResponse.json({ error: (dbError as { message: string }).message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const { user, error } = await getAuthenticatedMaschil()
  if (!user) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 })

  const adminClient = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (adminClient.from('profile_questions') as any)
    .select('created_by')
    .eq('id', params.id)
    .maybeSingle() as { data: { created_by: string } | null }

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.created_by !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: dbError } = await (adminClient.from('profile_questions') as any)
    .delete()
    .eq('id', params.id)

  if (dbError) return NextResponse.json({ error: (dbError as { message: string }).message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
