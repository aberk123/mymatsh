import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/database'

async function getCallerAndProfile() {
  const cookieStore = await cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cs) { try { cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch { /* */ } },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase.from('shadchan_profiles') as any)
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle() as { data: { id: string } | null }

  if (!profile) return null
  return { supabase, profileId: profile.id }
}

export async function POST(request: Request) {
  try {
    const ctx = await getCallerAndProfile()
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json() as { single_id?: string }
    if (!body.single_id) return NextResponse.json({ error: 'single_id required' }, { status: 400 })

    const { supabase, profileId } = ctx

    // Check for existing request
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase.from('representation_requests') as any)
      .select('id, status')
      .eq('single_id', body.single_id)
      .eq('shadchan_id', profileId)
      .maybeSingle() as { data: { id: string; status: string } | null }

    if (existing) {
      return NextResponse.json({ id: existing.id, status: existing.status }, { status: 409 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('representation_requests') as any)
      .insert({ single_id: body.single_id, shadchan_id: profileId, status: 'pending' })
      .select('id, status')
      .single() as { data: { id: string; status: string } | null; error: unknown }

    if (error) throw error
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
