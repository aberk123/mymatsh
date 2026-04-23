import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { type Database } from '@/types/database'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: singleId } = await params
  const cookieStore = await cookies()
  const callerClient = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
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
  const { data: rows } = await (admin.from('shadchan_singles') as any)
    .select('shadchan_id, created_at')
    .eq('single_id', singleId)
    .eq('is_familiar', true) as { data: Array<{ shadchan_id: string; created_at: string }> | null }

  if (!rows || rows.length === 0) return NextResponse.json({ shadchanim: [] })

  const ids = rows.map(r => r.shadchan_id)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profiles } = await (admin.from('shadchan_profiles') as any)
    .select('id, full_name, city, state, phone')
    .in('id', ids) as { data: Array<{ id: string; full_name: string; city: string | null; state: string | null; phone: string | null }> | null }

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))

  return NextResponse.json({
    shadchanim: rows.map(r => ({
      shadchan_id: r.shadchan_id,
      full_name: profileMap[r.shadchan_id]?.full_name ?? '—',
      city: [profileMap[r.shadchan_id]?.city, profileMap[r.shadchan_id]?.state].filter(Boolean).join(', ') || '—',
      phone: profileMap[r.shadchan_id]?.phone ?? null,
      linked_at: r.created_at,
    })),
  })
}
