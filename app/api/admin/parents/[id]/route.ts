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

// GET /api/admin/parents/[id]  — [id] is parents.id
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const caller = await requirePlatformAdmin()
  if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const db = adminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: parent } = await (db.from('parents') as any)
    .select('id, user_id, full_name, email, phone, city, child_id, profile_status, created_at')
    .eq('id', params.id)
    .maybeSingle() as {
      data: {
        id: string; user_id: string | null; full_name: string; email: string | null
        phone: string | null; city: string | null; child_id: string | null
        profile_status: string | null; created_at: string
      } | null
    }

  if (!parent) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let child: { id: string; first_name: string; last_name: string; status: string; gender: string } | null = null
  if (parent.child_id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (db.from('singles') as any)
      .select('id, first_name, last_name, status, gender')
      .eq('id', parent.child_id)
      .maybeSingle() as { data: typeof child }
    child = data
  }

  let userEmail: string | null = null
  if (parent.user_id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userRow } = await (db.from('users') as any)
      .select('email, status')
      .eq('id', parent.user_id)
      .maybeSingle() as { data: { email: string | null; status: string } | null }
    userEmail = userRow?.email ?? null
  }

  return NextResponse.json({ parent, child, userEmail })
}

// PATCH /api/admin/parents/[id]
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const caller = await requirePlatformAdmin()
  if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const db = adminClient()
  const body = await req.json() as {
    full_name?: string; email?: string; phone?: string; city?: string; profile_status?: string
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: parent } = await (db.from('parents') as any)
    .select('id, user_id, email')
    .eq('id', params.id)
    .maybeSingle() as { data: { id: string; user_id: string | null; email: string | null } | null }

  if (!parent) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const update: Record<string, unknown> = {}
  if (body.full_name !== undefined) update.full_name = body.full_name.trim()
  if (body.email !== undefined) update.email = body.email.trim() || null
  if (body.phone !== undefined) update.phone = body.phone.trim() || null
  if (body.city !== undefined) update.city = body.city.trim() || null
  if (body.profile_status !== undefined) update.profile_status = body.profile_status

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (db.from('parents') as any)
    .update(update)
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: (error as { message: string }).message }, { status: 500 })

  // Sync email to users table if changed
  if (body.email !== undefined && parent.user_id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.from('users') as any)
      .update({ email: body.email.trim() || null })
      .eq('id', parent.user_id)
  }

  return NextResponse.json({ ok: true })
}

// DELETE /api/admin/parents/[id]
// Body: { mode: 'parent_only' | 'parent_and_child' }
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const caller = await requirePlatformAdmin()
  if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const db = adminClient()
  const body = await req.json() as { mode: 'parent_only' | 'parent_and_child' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: parent } = await (db.from('parents') as any)
    .select('id, user_id, child_id')
    .eq('id', params.id)
    .maybeSingle() as { data: { id: string; user_id: string | null; child_id: string | null } | null }

  if (!parent) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (body.mode === 'parent_and_child' && parent.child_id) {
    // Fetch child's user_id before deleting
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: child } = await (db.from('singles') as any)
      .select('id, user_id')
      .eq('id', parent.child_id)
      .maybeSingle() as { data: { id: string; user_id: string | null } | null }

    // Delete match records
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.from('matches') as any)
      .delete()
      .or(`single1_id.eq.${parent.child_id},single2_id.eq.${parent.child_id}`)

    // Delete shadchan_singles records
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.from('shadchan_singles') as any)
      .delete()
      .eq('single_id', parent.child_id)

    // Delete child single
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.from('singles') as any)
      .delete()
      .eq('id', parent.child_id)

    // Delete child's user account
    if (child?.user_id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (db.from('users') as any).delete().eq('id', child.user_id)
      await db.auth.admin.deleteUser(child.user_id)
    }
  } else if (parent.child_id) {
    // Unlink child — keep child in system
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.from('singles') as any)
      .update({ parent_id: null })
      .eq('id', parent.child_id)
  }

  // Delete parent row
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (db.from('parents') as any)
    .delete()
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: (error as { message: string }).message }, { status: 500 })

  // Delete parent user account
  if (parent.user_id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.from('users') as any).delete().eq('id', parent.user_id)
    await db.auth.admin.deleteUser(parent.user_id)
  }

  return NextResponse.json({ ok: true })
}
