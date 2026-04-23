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

  // Merge notification preferences from the users table into the profile response
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: userPrefs } = await (adminClient.from('users') as any)
    .select('email_notifications, sms_notifications')
    .eq('id', user.id)
    .maybeSingle() as { data: { email_notifications: boolean; sms_notifications: boolean } | null }

  return NextResponse.json({
    profile: profile ? {
      ...profile,
      email_notifications: userPrefs?.email_notifications ?? true,
      sms_notifications: userPrefs?.sms_notifications ?? true,
    } : null,
  })
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

  const profileAllowed = [
    'title', 'full_name', 'city', 'state', 'country', 'phone', 'email',
    'languages', 'availability', 'best_contact_method', 'best_day', 'best_time',
    'age_bracket', 'years_experience', 'shidduchim_made',
    'available_for_advocacy', 'rates_for_services', 'type_of_service',
    'hide_personal_info_from_profile', 'reference_1', 'reference_2', 'organization_id',
  ]
  const profileUpdates: Record<string, unknown> = { user_id: user.id }
  for (const key of profileAllowed) {
    if (key in body) profileUpdates[key] = body[key]
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (adminClient.from('shadchan_profiles') as any)
    .upsert(profileUpdates, { onConflict: 'user_id' })

  if (error) {
    return NextResponse.json({ error: (error as { message: string }).message }, { status: 500 })
  }

  // Save notification preferences to the users table
  const userUpdates: Record<string, unknown> = {}
  if ('email_notifications' in body) userUpdates.email_notifications = body.email_notifications
  if ('sms_notifications' in body) userUpdates.sms_notifications = body.sms_notifications
  if (Object.keys(userUpdates).length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (adminClient.from('users') as any).update(userUpdates).eq('id', user.id)
  }

  return NextResponse.json({ ok: true })
}
