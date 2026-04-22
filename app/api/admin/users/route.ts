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
    const { firstName, lastName, email, phone, password, role } = body as {
      firstName: string
      lastName: string
      email?: string
      phone?: string
      password: string
      role: UserRole
    }

    const cleanEmail = email?.trim() || undefined
    const cleanPhone = phone?.trim() || undefined

    if (!firstName?.trim() || !lastName?.trim()) {
      return NextResponse.json({ error: 'First and last name are required' }, { status: 400 })
    }
    if (!cleanEmail && !cleanPhone) {
      return NextResponse.json({ error: 'Email or phone number is required' }, { status: 400 })
    }
    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
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
      ...(cleanEmail ? { email: cleanEmail } : {}),
      ...(cleanPhone ? { phone: cleanPhone } : {}),
      password,
      email_confirm: true,
      phone_confirm: true,
      user_metadata: {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      },
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const { error: dbError } = await adminClient.from('users').insert({
      id: newUser.user.id,
      email: cleanEmail ?? null,
      phone: cleanPhone ?? null,
      role,
      status: 'active',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    if (dbError) {
      // Best-effort rollback of the auth user
      await adminClient.auth.admin.deleteUser(newUser.user.id)
      return NextResponse.json({ error: dbError.message }, { status: 400 })
    }

    return NextResponse.json({
      id: newUser.user.id,
      email: cleanEmail,
      phone: cleanPhone,
      role,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
