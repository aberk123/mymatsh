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

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAdmin()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    const supabase = await getAdminClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: org, error } = await (supabase.from('organizations') as any)
      .select('id, name, email, city, primary_contact_name, is_approved, created_at')
      .eq('id', id)
      .maybeSingle() as {
        data: { id: string; name: string; email: string | null; city: string | null; primary_contact_name: string | null; is_approved: boolean; created_at: string } | null
        error: unknown
      }

    if (error) throw error
    if (!org) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: members } = await (supabase.from('org_members') as any)
      .select('id')
      .eq('org_id', id) as { data: Array<{ id: string }> | null }

    return NextResponse.json({ ...org, memberCount: members?.length ?? 0 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAdmin()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    const body = await request.json() as {
      name?: string
      email?: string
      city?: string
      primary_contact_name?: string
      is_approved?: boolean
    }

    const supabase = await getAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: org, error } = await (supabase.from('organizations') as any)
      .update({
        ...(body.name !== undefined ? { name: body.name.trim() } : {}),
        ...(body.email !== undefined ? { email: body.email.trim() || null } : {}),
        ...(body.city !== undefined ? { city: body.city.trim() || null } : {}),
        ...(body.primary_contact_name !== undefined ? { primary_contact_name: body.primary_contact_name.trim() || null } : {}),
        ...(body.is_approved !== undefined ? { is_approved: body.is_approved } : {}),
      })
      .eq('id', id)
      .select()
      .single() as {
        data: { id: string; name: string; email: string | null; city: string | null; primary_contact_name: string | null; is_approved: boolean; created_at: string } | null
        error: unknown
      }

    if (error) throw error
    return NextResponse.json(org)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
