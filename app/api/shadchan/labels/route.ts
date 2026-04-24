import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { type Database } from '@/types/database'

async function getShadchanProfileId(adminClient: ReturnType<typeof createClient<Database>>, userId: string): Promise<string | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (adminClient.from('shadchan_profiles') as any)
    .select('id').eq('user_id', userId).maybeSingle() as { data: { id: string } | null }
  return data?.id ?? null
}

async function requireShadchan(adminClient: ReturnType<typeof createClient<Database>>, callerClient: ReturnType<typeof createServerClient<Database>>) {
  const { data: { user } } = await callerClient.auth.getUser()
  if (!user) return { error: 'Unauthorized', status: 401, user: null, profileId: null }

  const { data: row } = await callerClient.from('users').select('role').eq('id', user.id).maybeSingle()
  if ((row as { role: string } | null)?.role !== 'shadchan') {
    return { error: 'Forbidden', status: 403, user: null, profileId: null }
  }

  const profileId = await getShadchanProfileId(adminClient, user.id)
  if (!profileId) return { error: 'Shadchan profile not found', status: 404, user: null, profileId: null }

  return { error: null, status: 200, user, profileId }
}

export async function GET() {
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

  const { error, status, profileId } = await requireShadchan(adminClient, callerClient)
  if (error) return NextResponse.json({ error }, { status })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: labels } = await (adminClient.from('labels') as any)
    .select('id, name, color, created_at')
    .eq('shadchan_id', profileId)
    .order('name') as { data: Array<{ id: string; name: string; color: string; created_at: string }> | null }

  return NextResponse.json({ labels: labels ?? [] })
}

export async function POST(request: Request) {
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

  const { error, status, profileId } = await requireShadchan(adminClient, callerClient)
  if (error) return NextResponse.json({ error }, { status })

  const { name, color } = await request.json() as { name: string; color?: string }
  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: label, error: insertError } = await (adminClient.from('labels') as any)
    .insert({ shadchan_id: profileId, name: name.trim(), color: color ?? '#6B7280' })
    .select('id, name, color')
    .single() as { data: { id: string; name: string; color: string } | null; error: unknown }

  if (insertError) {
    const msg = (insertError as { message: string }).message
    if (msg.includes('unique')) return NextResponse.json({ error: 'A label with this name already exists' }, { status: 409 })
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  return NextResponse.json({ label })
}
