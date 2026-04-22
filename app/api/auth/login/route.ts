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
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
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

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    const { data: userRow } = await supabase
      .from('users')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle()

    const role = (userRow as { role: UserRole } | null)?.role
    const redirectTo = role ? (ROLE_REDIRECT[role] ?? '/dashboard') : '/dashboard'

    return NextResponse.json({ redirectTo })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
