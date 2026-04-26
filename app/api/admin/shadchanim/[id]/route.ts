import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { type Database } from '@/types/database'

async function requirePlatformAdmin() {
  const cookieStore = await cookies()
  const caller = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cs) {
          try { cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) }
          catch { /* ignore */ }
        },
      },
    }
  )
  const { data: { user } } = await caller.auth.getUser()
  if (!user) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: row } = await (caller.from('users') as any).select('role').eq('id', user.id).maybeSingle() as { data: { role: string } | null }
  return row?.role === 'platform_admin' ? user : null
}

function adminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// GET /api/admin/shadchanim/[id]  — [id] is users.id
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const caller = await requirePlatformAdmin()
  if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const db = adminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: userRow } = await (db.from('users') as any)
    .select('id, email, phone, status, created_at')
    .eq('id', params.id)
    .maybeSingle() as { data: { id: string; email: string | null; phone: string | null; status: string; created_at: string } | null }

  if (!userRow) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (db.from('shadchan_profiles') as any)
    .select('id, user_id, full_name, email, phone, city, state, is_approved, approved_at, organization_id, created_at')
    .eq('user_id', params.id)
    .maybeSingle() as {
      data: {
        id: string; user_id: string; full_name: string; email: string | null; phone: string | null
        city: string | null; state: string | null; is_approved: boolean; approved_at: string | null
        organization_id: string | null; created_at: string
      } | null
    }

  let organizationName: string | null = null
  if (profile?.organization_id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: org } = await (db.from('organizations') as any)
      .select('name')
      .eq('id', profile.organization_id)
      .maybeSingle() as { data: { name: string } | null }
    organizationName = org?.name ?? null
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: orgs } = await (db.from('organizations') as any)
    .select('id, name')
    .order('name') as { data: Array<{ id: string; name: string }> | null }

  let singles: Array<{ id: string; first_name: string; last_name: string; status: string; gender: string }> = []
  if (profile) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: singlesData } = await (db.from('singles') as any)
      .select('id, first_name, last_name, status, gender')
      .eq('created_by_shadchan_id', profile.id)
      .order('last_name') as { data: typeof singles | null }
    singles = singlesData ?? []
  }

  return NextResponse.json({ userRow, profile, organizationName, organizations: orgs ?? [], singles })
}

// PATCH /api/admin/shadchanim/[id]
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const caller = await requirePlatformAdmin()
  if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const db = adminClient()
  const body = await req.json() as {
    full_name?: string; email?: string; phone?: string
    organization_id?: string | null; is_approved?: boolean
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (db.from('shadchan_profiles') as any)
    .select('id, email')
    .eq('user_id', params.id)
    .maybeSingle() as { data: { id: string; email: string | null } | null }

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const profileUpdate: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.full_name !== undefined) profileUpdate.full_name = body.full_name.trim()
  if (body.email !== undefined) profileUpdate.email = body.email.trim() || null
  if (body.phone !== undefined) profileUpdate.phone = body.phone.trim() || null
  if (body.organization_id !== undefined) profileUpdate.organization_id = body.organization_id || null
  if (body.is_approved !== undefined) {
    profileUpdate.is_approved = body.is_approved
    if (body.is_approved) {
      profileUpdate.approved_at = new Date().toISOString()
      profileUpdate.approved_by_admin_id = caller.id
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: profileError } = await (db.from('shadchan_profiles') as any)
    .update(profileUpdate)
    .eq('id', profile.id)

  if (profileError) return NextResponse.json({ error: (profileError as { message: string }).message }, { status: 500 })

  // Sync email change to users table
  if (body.email !== undefined && body.email !== profile.email) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.from('users') as any)
      .update({ email: body.email.trim() || null })
      .eq('id', params.id)
  }

  return NextResponse.json({ ok: true })
}

// DELETE /api/admin/shadchanim/[id]
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const caller = await requirePlatformAdmin()
  if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const db = adminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (db.from('shadchan_profiles') as any)
    .select('id')
    .eq('user_id', params.id)
    .maybeSingle() as { data: { id: string } | null }

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  // Unlink all singles they created
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.from('singles') as any)
    .update({ created_by_shadchan_id: null, updated_at: new Date().toISOString() })
    .eq('created_by_shadchan_id', profile.id)

  // Remove from shadchan_singles junction
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.from('shadchan_singles') as any)
    .delete()
    .eq('shadchan_id', profile.id)

  // Delete profile row — do NOT delete user or auth account
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (db.from('shadchan_profiles') as any)
    .delete()
    .eq('id', profile.id)

  if (error) return NextResponse.json({ error: (error as { message: string }).message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
