import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { type Database } from '@/types/database'
import { createNotification } from '@/lib/utils/notifications'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: singleId } = await params
  const cookieStore = await cookies()
  const callerClient = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )
  const { data: { user } } = await callerClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rows } = await (admin.from('shadchan_singles') as any)
    .select('shadchan_id, created_at')
    .eq('single_id', singleId)
    .eq('is_familiar', true) as { data: Array<{ shadchan_id: string; created_at: string }> | null }

  if (!rows || rows.length === 0) return NextResponse.json({ shadchanim: [] })

  const ids = rows.map(r => r.shadchan_id)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profiles } = await (admin.from('shadchan_profiles') as any)
    .select('id, full_name, city, state, phone')
    .in('id', ids) as { data: Array<{ id: string; full_name: string; city: string | null; state: string | null; phone: string | null }> | null }

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))

  return NextResponse.json({
    shadchanim: rows.map(r => ({
      shadchan_id: r.shadchan_id,
      full_name: profileMap[r.shadchan_id]?.full_name ?? '—',
      city: [profileMap[r.shadchan_id]?.city, profileMap[r.shadchan_id]?.state].filter(Boolean).join(', ') || '—',
      phone: profileMap[r.shadchan_id]?.phone ?? null,
      linked_at: r.created_at,
    })),
  })
}

// Single requests to add a shadchan they are familiar with
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: singleId } = await params
  const cookieStore = await cookies()
  const callerClient = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )
  const { data: { user } } = await callerClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { shadchan_profile_id } = await req.json() as { shadchan_profile_id: string }
  if (!shadchan_profile_id) return NextResponse.json({ error: 'shadchan_profile_id required' }, { status: 400 })

  const admin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Verify the single record belongs to this user
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: single } = await (admin.from('singles') as any)
    .select('id, first_name, last_name, user_id')
    .eq('id', singleId)
    .maybeSingle() as { data: { id: string; first_name: string; last_name: string; user_id: string | null } | null }

  if (!single || single.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Upsert shadchan_singles link with is_familiar=true
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin.from('shadchan_singles') as any)
    .upsert({ shadchan_id: shadchan_profile_id, single_id: singleId, is_familiar: true }, { onConflict: 'shadchan_id,single_id' })

  if (error) return NextResponse.json({ error: (error as { message: string }).message }, { status: 500 })

  // Notify the shadchan (get their user_id from shadchan_profiles)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sp } = await (admin.from('shadchan_profiles') as any)
    .select('user_id, full_name')
    .eq('id', shadchan_profile_id)
    .maybeSingle() as { data: { user_id: string; full_name: string } | null }

  if (sp?.user_id) {
    const singleName = [single.first_name, single.last_name].filter(Boolean).join(' ') || 'A single'
    await createNotification(sp.user_id, 'single_added_familiarity', {
      message: `${singleName} has indicated that they know you personally and added you to their Shadchanim list.`,
      link: `/dashboard/singles/${singleId}`,
    })
  }

  return NextResponse.json({ ok: true })
}

// Single removes a familiar shadchan from their list
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: singleId } = await params
  const url = new URL(req.url)
  const shadchanProfileId = url.searchParams.get('shadchan_profile_id')
  if (!shadchanProfileId) return NextResponse.json({ error: 'shadchan_profile_id required' }, { status: 400 })

  const cookieStore = await cookies()
  const callerClient = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )
  const { data: { user } } = await callerClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: single } = await (admin.from('singles') as any)
    .select('user_id').eq('id', singleId).maybeSingle() as { data: { user_id: string | null } | null }

  if (!single || single.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin.from('shadchan_singles') as any)
    .delete()
    .eq('shadchan_id', shadchanProfileId)
    .eq('single_id', singleId)

  return NextResponse.json({ ok: true })
}
