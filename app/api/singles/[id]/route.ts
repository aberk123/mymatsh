import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { type Database, type UserRole } from '@/types/database'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const cookieStore = await cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )

  const { data, error } = await supabase
    .from('singles')
    .select('*')
    .eq('id', params.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(data)
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const cookieStore = await cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // ignore in middleware contexts
          }
        },
      },
    }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: userRow } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const role = (userRow as { role: UserRole } | null)?.role

  // Shadchanim and org admins can never edit personal info
  if (role === 'shadchan' || role === 'org_admin') {
    return NextResponse.json(
      { error: "Shadchanim cannot edit singles' personal information. Only the single or their parent may update this profile." },
      { status: 403 }
    )
  }

  if (role !== 'single' && role !== 'parent' && role !== 'platform_admin') {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  // Fetch the target single to verify ownership
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: targetSingle } = await (supabase.from('singles') as any)
    .select('user_id, parent_id')
    .eq('id', params.id)
    .maybeSingle() as { data: { user_id: string | null; parent_id: string | null } | null }

  if (!targetSingle) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (role === 'single') {
    // Singles can only edit their own profile
    if (targetSingle.user_id !== user.id) {
      return NextResponse.json({ error: 'You can only edit your own profile.' }, { status: 403 })
    }
  } else if (role === 'parent') {
    // Parents can only edit their linked child's profile
    if (!targetSingle.parent_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const { data: parentRow } = await supabase
      .from('parents')
      .select('id')
      .eq('id', targetSingle.parent_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!parentRow) {
      return NextResponse.json({ error: "You can only edit your own child's profile." }, { status: 403 })
    }
  }
  // platform_admin: no ownership check needed

  const body = await request.json()

  // Prevent role escalation or status manipulation through this endpoint
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { status, created_by_shadchan_id, user_id, ...safeFields } = body as Record<string, unknown>

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (supabase.from('singles') as any)
    .update(safeFields)
    .eq('id', params.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
