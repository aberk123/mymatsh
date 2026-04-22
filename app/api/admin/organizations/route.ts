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
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch { /* ignore */ }
        },
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
    const { data: orgs, error } = await (supabase.from('organizations') as any)
      .select('id, name, email, city, primary_contact_name, is_approved, created_at')
      .order('created_at', { ascending: false }) as {
        data: Array<{
          id: string
          name: string
          email: string | null
          city: string | null
          primary_contact_name: string | null
          is_approved: boolean
          created_at: string
        }> | null
        error: unknown
      }

    if (error) throw error

    // Count members per org
    const orgIds = (orgs ?? []).map((o) => o.id)
    const memberCounts: Record<string, number> = {}
    if (orgIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: members } = await (supabase.from('org_members') as any)
        .select('org_id')
        .in('org_id', orgIds) as { data: Array<{ org_id: string }> | null }
      for (const m of members ?? []) {
        memberCounts[m.org_id] = (memberCounts[m.org_id] ?? 0) + 1
      }
    }

    return NextResponse.json(
      (orgs ?? []).map((o) => ({ ...o, memberCount: memberCounts[o.id] ?? 0 }))
    )
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAdmin()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json() as {
      name: string
      email?: string
      city?: string
      primary_contact_name?: string
      is_approved?: boolean
    }

    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const supabase = await getAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: org, error } = await (supabase.from('organizations') as any)
      .insert({
        name: body.name.trim(),
        email: body.email?.trim() || null,
        city: body.city?.trim() || null,
        primary_contact_name: body.primary_contact_name?.trim() || null,
        is_approved: body.is_approved ?? false,
      })
      .select()
      .single() as { data: { id: string; name: string; email: string | null; city: string | null; primary_contact_name: string | null; is_approved: boolean; created_at: string } | null; error: unknown }

    if (error) throw error
    return NextResponse.json({ ...org, memberCount: 0 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
