import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { type Database } from '@/types/database'

async function getCtx(singleId: string) {
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
  if (!user) return { error: 'Unauthorized', status: 401 } as const

  const admin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: userRow } = await (admin.from('users') as any)
    .select('role').eq('id', user.id).maybeSingle() as { data: { role: string } | null }
  const role = userRow?.role ?? ''

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: single } = await (admin.from('singles') as any)
    .select('id, user_id, created_by_shadchan_id').eq('id', singleId).maybeSingle() as
    { data: { id: string; user_id: string | null; created_by_shadchan_id: string } | null }
  if (!single) return { error: 'Single not found', status: 404 } as const

  let profileId: string | null = null
  if (role === 'shadchan') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: sp } = await (admin.from('shadchan_profiles') as any)
      .select('id').eq('user_id', user.id).maybeSingle() as { data: { id: string } | null }
    profileId = sp?.id ?? null
  }

  const isMine = role === 'single' && single.user_id === user.id
  const isShadchan = role === 'shadchan' && profileId !== null &&
    single.created_by_shadchan_id === profileId
  const isAdmin = role === 'platform_admin'

  if (!isMine && !isShadchan && !isAdmin) {
    if (role === 'shadchan' && profileId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: link } = await (admin.from('shadchan_singles') as any)
        .select('single_id').eq('shadchan_id', profileId).eq('single_id', singleId).maybeSingle() as
        { data: { single_id: string } | null }
      if (!link) return { error: 'Forbidden', status: 403 } as const
    } else {
      return { error: 'Forbidden', status: 403 } as const
    }
  }

  return { user, role, single, admin }
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getCtx(id)
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (ctx.admin.from('single_family_details') as any)
    .select('*').eq('single_id', id).maybeSingle() as { data: Record<string, unknown> | null }

  return NextResponse.json({ family: data ?? null })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getCtx(id)
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

  const body = await req.json() as Record<string, unknown>
  const allowed = [
    'fathers_name', 'fathers_occupation', 'mothers_name', 'mothers_maiden_name',
    'mothers_occupation', 'num_siblings', 'siblings_detail', 'grandparents', 'family_notes',
    'father_hebrew_name', 'mother_hebrew_name',
    'father_phone', 'mother_phone', 'father_email', 'mother_email',
    'family_shul_name', 'family_shul_address',
    'family_rav_name', 'family_rav_phone', 'family_rav_shul',
  ]
  const payload: Record<string, unknown> = { single_id: id, updated_at: new Date().toISOString() }
  for (const k of allowed) if (k in body) payload[k] = body[k]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (ctx.admin.from('single_family_details') as any)
    .upsert(payload, { onConflict: 'single_id' })
    .select().single() as { data: Record<string, unknown> | null; error: unknown }

  if (error) return NextResponse.json({ error: (error as { message: string }).message }, { status: 500 })
  return NextResponse.json({ family: data })
}
