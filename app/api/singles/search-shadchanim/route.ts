import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { type Database } from '@/types/database'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const q = (url.searchParams.get('q') ?? '').trim()
  if (q.length < 2) return NextResponse.json({ shadchanim: [] })

  const cookieStore = await cookies()
  const callerClient = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )
  const { data: { user } } = await callerClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin.from('shadchan_profiles') as any)
    .select('id, full_name, city, state, phone')
    .ilike('full_name', `%${q}%`)
    .limit(10) as {
      data: Array<{ id: string; full_name: string; city: string | null; state: string | null; phone: string | null }> | null
    }

  return NextResponse.json({
    shadchanim: (data ?? []).map(s => ({
      id: s.id,
      full_name: s.full_name,
      location: [s.city, s.state].filter(Boolean).join(', '),
    })),
  })
}
