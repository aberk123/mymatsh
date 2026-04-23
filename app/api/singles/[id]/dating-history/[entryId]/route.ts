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
  if (userRow?.role !== 'shadchan') return { error: 'Forbidden', status: 403 } as const

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sp } = await (admin.from('shadchan_profiles') as any)
    .select('id').eq('user_id', user.id).maybeSingle() as { data: { id: string } | null }
  if (!sp) return { error: 'Shadchan profile not found', status: 404 } as const

  return { user, admin, profileId: sp.id }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; entryId: string }> }) {
  const { id: singleId, entryId } = await params
  const ctx = await getCtx()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

  const body = await req.json() as Record<string, unknown>
  const allowed = ['person_name', 'date_approximate', 'outcome', 'notes']
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const k of allowed) if (k in body) payload[k] = body[k]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (ctx.admin.from('single_dating_history') as any)
    .update(payload)
    .eq('id', entryId)
    .eq('single_id', singleId)
    .eq('shadchan_id', ctx.profileId)

  if (error) return NextResponse.json({ error: (error as { message: string }).message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; entryId: string }> }) {
  const { id: singleId, entryId } = await params
  const ctx = await getCtx()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (ctx.admin.from('single_dating_history') as any)
    .delete()
    .eq('id', entryId)
    .eq('single_id', singleId)
    .eq('shadchan_id', ctx.profileId)

  if (error) return NextResponse.json({ error: (error as { message: string }).message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
