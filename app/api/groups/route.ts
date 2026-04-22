import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { type Database, type GroupVisibility } from '@/types/database'

export async function POST(request: Request) {
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
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: row } = await callerClient.from('users').select('role').eq('id', user.id).maybeSingle()
  if ((row as { role: string } | null)?.role !== 'shadchan') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

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

  const body = await request.json() as { name: string; visibility: GroupVisibility }
  if (!body.name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: newGroup, error: dbError } = await (adminClient.from('groups') as any)
    .insert({ name: body.name.trim(), visibility: body.visibility ?? 'public', created_by: profile.id })
    .select('id, name, visibility, created_at')
    .single() as { data: { id: string; name: string; visibility: GroupVisibility; created_at: string } | null; error: unknown }

  if (dbError) return NextResponse.json({ error: (dbError as { message: string }).message }, { status: 500 })

  // Add the creator as a member
  if (newGroup) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (adminClient.from('group_members') as any)
      .insert({ group_id: newGroup.id, shadchan_id: profile.id, role: 'admin' })
  }

  return NextResponse.json(newGroup)
}
