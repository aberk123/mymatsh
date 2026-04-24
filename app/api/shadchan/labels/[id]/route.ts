import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { type Database } from '@/types/database'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const cookieStore = await cookies()
  const callerClient = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )
  const adminClient = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: { user } } = await callerClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify the label belongs to this shadchan
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profileRow } = await (adminClient.from('shadchan_profiles') as any)
    .select('id').eq('user_id', user.id).maybeSingle() as { data: { id: string } | null }
  if (!profileRow) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: label } = await (adminClient.from('labels') as any)
    .select('id').eq('id', params.id).eq('shadchan_id', profileRow.id).maybeSingle() as { data: { id: string } | null }
  if (!label) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updates = await request.json() as { name?: string; color?: string }
  const patch: Record<string, string> = {}
  if (updates.name?.trim()) patch.name = updates.name.trim()
  if (updates.color) patch.color = updates.color

  if (Object.keys(patch).length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: updated, error } = await (adminClient.from('labels') as any)
    .update(patch).eq('id', params.id).select('id, name, color').single() as { data: { id: string; name: string; color: string } | null; error: unknown }

  if (error) return NextResponse.json({ error: (error as { message: string }).message }, { status: 500 })
  return NextResponse.json({ label: updated })
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const cookieStore = await cookies()
  const callerClient = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )
  const adminClient = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: { user } } = await callerClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profileRow } = await (adminClient.from('shadchan_profiles') as any)
    .select('id').eq('user_id', user.id).maybeSingle() as { data: { id: string } | null }
  if (!profileRow) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: label } = await (adminClient.from('labels') as any)
    .select('id').eq('id', params.id).eq('shadchan_id', profileRow.id).maybeSingle() as { data: { id: string } | null }
  if (!label) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (adminClient.from('labels') as any).delete().eq('id', params.id)
  return NextResponse.json({ ok: true })
}
