import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import { type Database } from '@/types/database'

// Maps each role to its home portal — used for wrong-role redirects
const ROLE_HOME: Record<string, string> = {
  platform_admin: '/admin',
  shadchan: '/dashboard',
  org_admin: '/dashboard',
  single: '/portal/single',
  parent: '/portal/parent',
  advocate: '/portal/advocate',
  maschil: '/portal/maschil',
}

// Ordered list of [route-prefix, allowed-roles] pairs
const ROUTE_ROLES: Array<[string, string[]]> = [
  ['/admin',           ['platform_admin']],
  ['/dashboard',       ['shadchan', 'org_admin']],
  ['/portal/single',   ['single']],
  ['/portal/parent',   ['parent']],
  ['/portal/advocate', ['advocate']],
  ['/portal/maschil',  ['maschil']],
]

function getAllowedRoles(pathname: string): string[] | null {
  for (const [prefix, roles] of ROUTE_ROLES) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) {
      return roles
    }
  }
  return null
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // API routes handle their own auth — never redirect them
  if (pathname.startsWith('/api/')) {
    return supabaseResponse
  }

  // Public routes — no auth required
  const publicPaths = ['/', '/about', '/mission', '/contact', '/login', '/verify', '/review', '/forgot-password', '/reset-password', '/auth/signout']
  const isPublic = publicPaths.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )

  if (!user) {
    if (isPublic) return supabaseResponse
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Authenticated — check role-based access only for role-protected routes
  const allowedRoles = getAllowedRoles(pathname)
  if (!allowedRoles) return supabaseResponse

  const { data: userRow } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const role = (userRow as { role: string } | null)?.role

  if (!role || !allowedRoles.includes(role)) {
    const url = request.nextUrl.clone()
    url.pathname = (role && ROLE_HOME[role]) ?? '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
