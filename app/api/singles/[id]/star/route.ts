import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { type Database } from '@/types/database'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: singleId } = await params
  const cookieStore = await cookies()
  const callerClient = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) }
          catch { /* ignore */ }
        },
      },
    }
  )
  const { data: { user } } = await callerClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: userRow } = await (admin.from('users') as any)
    .select('role').eq('id', user.id).maybeSingle() as { data: { role: string } | null }
  if (userRow?.role !== 'shadchan') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sp } = await (admin.from('shadchan_profiles') as any)
    .select('id').eq('user_id', user.id).maybeSingle() as { data: { id: string } | null }
  if (!sp) return NextResponse.json({ error: 'Shadchan profile not found' }, { status: 404 })

  // Toggle: check if already starred
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (admin.from('single_stars') as any)
    .select('shadchan_id').eq('shadchan_id', sp.id).eq('single_id', singleId).maybeSingle() as
    { data: { shadchan_id: string } | null }

  if (existing) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin.from('single_stars') as any).delete().eq('shadchan_id', sp.id).eq('single_id', singleId)
    return NextResponse.json({ starred: false })
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin.from('single_stars') as any).insert({ shadchan_id: sp.id, single_id: singleId })
    return NextResponse.json({ starred: true })
  }
}
