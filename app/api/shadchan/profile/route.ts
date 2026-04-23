import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { type Database } from '@/types/database'

async function getClients() {
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
  const adminClient = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
  return { callerClient, adminClient }
}

export async function GET() {
  const { callerClient, adminClient } = await getClients()

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (adminClient.from('shadchan_profiles') as any)
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  return NextResponse.json({ profile: profile ?? null })
}

export async function PATCH(request: Request) {
  const { callerClient, adminClient } = await getClients()

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

  const body = await request.json() as Record<string, unknown>

  const allowed = [
    'title', 'full_name', 'city', 'state', 'country', 'phone', 'email',
    'languages', 'availability', 'best_contact_method', 'best_day', 'best_time',
    'age_bracket', 'years_experience', 'shidduchim_made',
    'available_for_advocacy', 'rates_for_services', 'type_of_service',
    'hide_personal_info_from_profile', 'reference_1', 'reference_2', 'organization_id',
  ]
  const updates: Record<string, unknown> = { user_id: user.id }
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (adminClient.from('shadchan_profiles') as any)
    .upsert(updates, { onConflict: 'user_id' })

  if (error) {
    return NextResponse.json({ error: (error as { message: string }).message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
