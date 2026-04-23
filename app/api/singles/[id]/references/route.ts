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
  const { data } = await (ctx.admin.from('single_references') as any)
    .select('*').eq('single_id', id).order('created_at', { ascending: true }) as
    { data: Record<string, unknown>[] | null }

  return NextResponse.json({ references: data ?? [] })
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getCtx(id)
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

  const body = await req.json() as { references: Array<{ name: string; relationship?: string; phone?: string; email?: string; notes?: string }> }
  if (!Array.isArray(body.references)) {
    return NextResponse.json({ error: 'references must be an array' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (ctx.admin.from('single_references') as any).delete().eq('single_id', id)

  if (body.references.length > 0) {
    const rows = body.references.map((r) => ({
      single_id: id,
      name: r.name,
      relationship: r.relationship ?? null,
      phone: r.phone ?? null,
      email: r.email ?? null,
      notes: r.notes ?? null,
    }))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (ctx.admin.from('single_references') as any).insert(rows)
    if (error) return NextResponse.json({ error: (error as { message: string }).message }, { status: 500 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (ctx.admin.from('single_references') as any)
    .select('*').eq('single_id', id).order('created_at', { ascending: true }) as
    { data: Record<string, unknown>[] | null }

  return NextResponse.json({ references: data ?? [] })
}
