import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { type Database, type UserRole } from '@/types/database'

const ROLE_REDIRECT: Record<UserRole, string> = {
  platform_admin: '/admin',
  shadchan: '/dashboard',
  org_admin: '/dashboard',
  single: '/portal/single',
  parent: '/portal/parent',
  advocate: '/portal/advocate',
  maschil: '/portal/maschil',
}

export async function POST(request: Request) {
  try {
    const { identifier, password } = await request.json()

    if (!identifier || !password) {
      return NextResponse.json({ error: 'Email/phone and password are required' }, { status: 400 })
    }

    const cookieStore = await cookies()

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // ignore — cookies will be set via middleware on next request
            }
          },
        },
      }
    )

    // Detect whether the identifier is an email or phone number
    const isEmail = identifier.includes('@')
    const signInArgs = isEmail
      ? { email: identifier.trim(), password }
      : { phone: identifier.trim(), password }

    const { data, error } = await supabase.auth.signInWithPassword(signInArgs)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    const { data: userRow } = await supabase
      .from('users')
      .select('role, status')
      .eq('id', data.user.id)
      .maybeSingle()

    const row = userRow as { role: UserRole; status: string } | null

    if (row?.status === 'pending') {
      // Sign the user back out so they don't get a session
      await supabase.auth.signOut()
      return NextResponse.json(
        { error: 'Your application is pending review. You will be notified once it has been approved.' },
        { status: 403 }
      )
    }

    if (row?.status === 'suspended') {
      await supabase.auth.signOut()
      return NextResponse.json(
        { error: 'Your account has been suspended. Please contact support.' },
        { status: 403 }
      )
    }

    const role = row?.role
    const redirectTo = role ? (ROLE_REDIRECT[role] ?? '/dashboard') : '/dashboard'

    return NextResponse.json({ redirectTo })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
