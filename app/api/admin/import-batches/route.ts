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

export async function GET() {
  try {
    const user = await requireAdmin()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const supabase = await getAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('import_batches') as any)
      .select('id, shadchan_id, submitted_by_admin_id, status, review_token, shadchan_comments, import_summary, created_at, updated_at')
      .order('created_at', { ascending: false }) as {
        data: Array<{
          id: string
          shadchan_id: string
          submitted_by_admin_id: string
          status: string
          review_token: string
          shadchan_comments: string | null
          import_summary: Record<string, unknown> | null
          created_at: string
          updated_at: string
        }> | null
        error: unknown
      }
    if (error) throw error

    const batches = data ?? []

    // Resolve shadchan names
    const shadchanIds = Array.from(new Set(batches.map((b) => b.shadchan_id)))
    const shadchanMap: Record<string, string> = {}
    if (shadchanIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profiles } = await (supabase.from('shadchan_profiles') as any)
        .select('id, full_name')
        .in('id', shadchanIds) as { data: Array<{ id: string; full_name: string }> | null }
      for (const p of profiles ?? []) shadchanMap[p.id] = p.full_name
    }

    return NextResponse.json(batches.map((b) => ({
      ...b,
      shadchan_name: shadchanMap[b.shadchan_id] ?? '—',
    })))
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAdmin()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json() as {
      shadchan_id: string
      parsed_data: unknown[]
    }

    if (!body.shadchan_id || !Array.isArray(body.parsed_data)) {
      return NextResponse.json({ error: 'shadchan_id and parsed_data are required' }, { status: 400 })
    }

    const supabase = await getAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: batch, error } = await (supabase.from('import_batches') as any)
      .insert({
        shadchan_id: body.shadchan_id,
        submitted_by_admin_id: user.id,
        parsed_data: body.parsed_data,
        status: 'pending_review',
      })
      .select()
      .single() as {
        data: { id: string; review_token: string; status: string; created_at: string } | null
        error: unknown
      }

    if (error) throw error
    return NextResponse.json(batch)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
