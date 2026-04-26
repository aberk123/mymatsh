import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { type Database } from '@/types/database'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const cookieStore = await cookies()
  const callerClient = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) }
          catch { /* ignore */ }
        },
      },
    }
  )

  const { data: { user } } = await callerClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: callerRow } = await callerClient.from('users').select('role').eq('id', user.id).maybeSingle()
  if ((callerRow as { role: string } | null)?.role !== 'platform_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const adminClient = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: single, error: singleError } = await (adminClient.from('singles') as any)
    .select('*')
    .eq('id', params.id)
    .maybeSingle()

  if (singleError || !single) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: education } = await (adminClient.from('single_education') as any)
    .select('*')
    .eq('single_id', params.id)
    .maybeSingle()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: family } = await (adminClient.from('single_family_details') as any)
    .select('*')
    .eq('single_id', params.id)
    .maybeSingle()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: photos } = await (adminClient.from('single_photos') as any)
    .select('id, public_url, position, caption')
    .eq('single_id', params.id)
    .order('position')

  // All approved shadchanim for assign-shadchan dropdown
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: availableShadchanim } = await (adminClient.from('shadchan_profiles') as any)
    .select('id, full_name, city')
    .eq('is_approved', true)
    .order('full_name') as { data: Array<{ id: string; full_name: string; city: string | null }> | null }

  let creatorShadchan = null
  if (single.created_by_shadchan_id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (adminClient.from('shadchan_profiles') as any)
      .select('id, full_name, email, phone, city')
      .eq('id', single.created_by_shadchan_id)
      .maybeSingle()
    creatorShadchan = data
  }

  // Shadchanim who have this single in their list
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawShadchanSingles } = await (adminClient.from('shadchan_singles') as any)
    .select('shadchan_id, is_familiar, shadchan_profiles(id, full_name, email, city)')
    .eq('single_id', params.id)

  const shadchanList = (rawShadchanSingles ?? []).map((row: {
    shadchan_id: string
    is_familiar: boolean
    shadchan_profiles: { id: string; full_name: string; email: string | null; city: string | null } | null
  }) => ({
    shadchan_id: row.shadchan_id,
    is_familiar: row.is_familiar,
    full_name: row.shadchan_profiles?.full_name ?? '—',
    email: row.shadchan_profiles?.email ?? null,
    city: row.shadchan_profiles?.city ?? null,
  }))

  return NextResponse.json({ single, education, family, photos: photos ?? [], creatorShadchan, shadchanList, availableShadchanim: availableShadchanim ?? [] })
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const cookieStore = await cookies()
  const callerClient = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) }
          catch { /* ignore */ }
        },
      },
    }
  )

  const { data: { user } } = await callerClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: callerRow } = await callerClient.from('users').select('role').eq('id', user.id).maybeSingle()
  if ((callerRow as { role: string } | null)?.role !== 'platform_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const adminClient = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const body = await request.json() as { created_by_shadchan_id: string | null }
  const { created_by_shadchan_id } = body

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (adminClient.from('singles') as any)
    .update({ created_by_shadchan_id, updated_at: new Date().toISOString() })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: (error as { message: string }).message }, { status: 500 })

  if (created_by_shadchan_id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (adminClient.from('shadchan_singles') as any)
      .upsert({ shadchan_id: created_by_shadchan_id, single_id: params.id }, { onConflict: 'shadchan_id,single_id' })
  }

  return NextResponse.json({ success: true })
}
