import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/database'

async function getAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function requireAdmin() {
  const cookieStore = await cookies()
  const caller = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cs) { try { cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch { /* */ } },
      },
    }
  )
  const { data: { user } } = await caller.auth.getUser()
  if (!user) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: row } = await caller.from('users' as any).select('role').eq('id', user.id).maybeSingle() as { data: { role: string } | null }
  if (row?.role !== 'platform_admin') return null
  return user
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAdmin()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    const supabase = await getAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: batch, error } = await (supabase.from('import_batches') as any)
      .select('*')
      .eq('id', id)
      .maybeSingle() as { data: Record<string, unknown> | null; error: unknown }

    if (error) throw error
    if (!batch) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Resolve shadchan name
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: sp } = await (supabase.from('shadchan_profiles') as any)
      .select('full_name')
      .eq('id', batch.shadchan_id)
      .maybeSingle() as { data: { full_name: string } | null }

    return NextResponse.json({ ...batch, shadchan_name: sp?.full_name ?? '—' })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAdmin()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    const body = await request.json() as { parsed_data?: unknown[]; status?: string }
    const supabase = await getAdminClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('import_batches') as any)
      .update({
        ...(body.parsed_data !== undefined ? { parsed_data: body.parsed_data } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single() as { data: Record<string, unknown> | null; error: unknown }

    if (error) throw error
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
