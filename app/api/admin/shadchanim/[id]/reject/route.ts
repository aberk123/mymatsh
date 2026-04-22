import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { type Database } from '@/types/database'

export async function POST(_request: Request, { params }: { params: { id: string } }) {
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

  if ((callerRow as { role: string } | null)?.role !== 'platform_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const adminClient = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Fetch the profile to get the linked user_id
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile, error: fetchError } = await (adminClient.from('shadchan_profiles') as any)
    .select('user_id')
    .eq('id', params.id)
    .maybeSingle() as { data: { user_id: string } | null; error: unknown }

  if (fetchError || !profile) {
    return NextResponse.json({ error: 'Shadchan profile not found' }, { status: 404 })
  }

  // Suspend the user account so they cannot log in
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: userError } = await (adminClient.from('users') as any)
    .update({ status: 'suspended' })
    .eq('id', profile.user_id)

  if (userError) {
    return NextResponse.json({ error: (userError as { message: string }).message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
