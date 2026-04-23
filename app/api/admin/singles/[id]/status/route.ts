import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { type Database } from '@/types/database'
import { createNotification } from '@/lib/utils/notifications'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
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

  const { status } = await request.json() as { status: string }
  const validStatuses = ['available', 'on_hold', 'engaged', 'married', 'inactive']
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (adminClient.from('singles') as any)
    .update({ status })
    .eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: (error as { message: string }).message }, { status: 500 })
  }

  // Notify the shadchan when a single becomes engaged or married
  if (status === 'engaged' || status === 'married') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: single } = await (adminClient.from('singles') as any)
        .select('first_name, last_name, created_by_shadchan_id')
        .eq('id', params.id)
        .maybeSingle() as { data: { first_name: string; last_name: string; created_by_shadchan_id: string | null } | null }

      if (single?.created_by_shadchan_id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: shadchanProfile } = await (adminClient.from('shadchan_profiles') as any)
          .select('user_id')
          .eq('id', single.created_by_shadchan_id)
          .maybeSingle() as { data: { user_id: string } | null }

        if (shadchanProfile?.user_id) {
          const name = `${single.first_name} ${single.last_name}`
          await createNotification(shadchanProfile.user_id, 'single_status_changed', {
            single_id: params.id,
            single_name: name,
            new_status: status,
            message: `${name} is now ${status}. Mazel Tov!`,
            link: `/dashboard/singles/${params.id}`,
          })
        }
      }
    } catch { /* non-critical */ }
  }

  return NextResponse.json({ ok: true })
}
