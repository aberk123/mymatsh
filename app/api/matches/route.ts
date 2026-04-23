import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { type Database } from '@/types/database'
import { createNotification } from '@/lib/utils/notifications'

export async function POST(request: Request) {
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

  const { data: { user } } = await callerClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: callerRow } = await callerClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if ((callerRow as { role: string } | null)?.role !== 'shadchan') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const adminClient = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (adminClient.from('shadchan_profiles') as any)
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle() as { data: { id: string } | null }

  if (!profile) {
    return NextResponse.json({ error: 'Shadchan profile not found' }, { status: 404 })
  }

  const { boy_id, girl_id, notes, suggested_by_name } = await request.json() as {
    boy_id: string
    girl_id: string
    notes?: string
    suggested_by_name?: string
  }

  if (!boy_id || !girl_id) {
    return NextResponse.json({ error: 'boy_id and girl_id are required' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: newMatch, error } = await (adminClient.from('matches') as any)
    .insert({
      shadchan_id: profile.id,
      boy_id,
      girl_id,
      status: 'pending',
      message: notes ?? null,
      suggested_by_name: suggested_by_name ?? null,
      notified_boy: false,
      notified_girl: false,
    })
    .select('id')
    .single() as { data: { id: string } | null; error: unknown }

  if (error) {
    return NextResponse.json({ error: (error as { message: string }).message }, { status: 500 })
  }

  // Notify singles who have portal accounts
  if (newMatch) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: singles } = await (adminClient.from('singles') as any)
      .select('id, user_id, first_name, last_name')
      .in('id', [boy_id, girl_id]) as { data: { id: string; user_id: string | null; first_name: string; last_name: string }[] | null }

    for (const s of singles ?? []) {
      if (!s.user_id) continue
      await createNotification(s.user_id, 'match_suggested', {
        match_id: newMatch.id,
        message: 'A new match has been suggested for you.',
        link: '/portal/single/matches',
      })
    }
  }

  return NextResponse.json({ id: newMatch?.id })
}
