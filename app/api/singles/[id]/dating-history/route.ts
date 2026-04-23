import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { type Database } from '@/types/database'

async function getCtx() {
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

  if (role !== 'shadchan' && role !== 'platform_admin') {
    return { error: 'Forbidden', status: 403 } as const
  }

  let profileId: string | null = null
  if (role === 'shadchan') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: sp } = await (admin.from('shadchan_profiles') as any)
      .select('id').eq('user_id', user.id).maybeSingle() as { data: { id: string } | null }
    if (!sp) return { error: 'Shadchan profile not found', status: 404 } as const
    profileId = sp.id
  }

  return { user, role, admin, profileId }
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getCtx()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (ctx.admin.from('single_dating_history') as any)
    .select('*').eq('single_id', id).order('created_at', { ascending: false })

  if (ctx.role === 'shadchan' && ctx.profileId) {
    query = query.eq('shadchan_id', ctx.profileId)
  }

  const { data } = await query as { data: Record<string, unknown>[] | null }
  return NextResponse.json({ history: data ?? [] })
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getCtx()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status })
  if (!ctx.profileId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json() as Record<string, unknown>
  const personName = typeof body.person_name === 'string' ? body.person_name.trim() : ''
  if (!personName) return NextResponse.json({ error: 'person_name is required' }, { status: 400 })

  const payload = {
    single_id: id,
    shadchan_id: ctx.profileId,
    person_name: personName,
    date_approximate: typeof body.date_approximate === 'string' ? body.date_approximate : null,
    outcome: typeof body.outcome === 'string' ? body.outcome : null,
    notes: typeof body.notes === 'string' ? body.notes : null,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (ctx.admin.from('single_dating_history') as any)
    .insert(payload).select().single() as { data: Record<string, unknown> | null; error: unknown }

  if (error) return NextResponse.json({ error: (error as { message: string }).message }, { status: 500 })
  return NextResponse.json({ entry: data }, { status: 201 })
}
