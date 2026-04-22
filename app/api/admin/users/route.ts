import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { type Database, type UserRole } from '@/types/database'

export async function POST(request: Request) {
  try {
    // Verify caller is a platform_admin
    const cookieStore = await cookies()
    const callerClient = createServerClient<Database>(
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

    const { data: { user: caller } } = await callerClient.auth.getUser()
    if (!caller) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: callerRow } = await callerClient
      .from('users')
      .select('role')
      .eq('id', caller.id)
      .maybeSingle()

    if ((callerRow as { role: string } | null)?.role !== 'platform_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse and validate body
    const body = await request.json()
    const { email, password, role, phone } = body as {
      email: string
      password: string
      role: UserRole
      phone?: string
    }

    if (!email || !password || !role) {
      return NextResponse.json({ error: 'Email, password, and role are required' }, { status: 400 })
    }

    const validRoles: UserRole[] = ['shadchan', 'single', 'parent', 'advocate', 'maschil']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Use service role key to create the user
    const adminClient = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: newUser, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      phone: phone || undefined,
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const { error: dbError } = await adminClient.from('users').insert({
      id: newUser.user.id,
      email,
      phone: phone || null,
      role,
      status: 'active',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    if (dbError) {
      // Best-effort rollback of the auth user
      await adminClient.auth.admin.deleteUser(newUser.user.id)
      return NextResponse.json({ error: dbError.message }, { status: 400 })
    }

    return NextResponse.json({ id: newUser.user.id, email, role })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
