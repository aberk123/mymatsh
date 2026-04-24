import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { type Database } from '@/types/database'
import { createNotification } from '@/lib/utils/notifications'
import { sendEmail } from '@/lib/utils/send-email'
import { sendSms } from '@/lib/utils/send-sms'
import { emailTemplate } from '@/lib/utils/email-template'

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

  // params.id is the users.id — look up profile by user_id (avoids client-side RLS issue)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile, error: fetchError } = await (adminClient.from('shadchan_profiles') as any)
    .select('id, user_id, phone, email, full_name')
    .eq('user_id', params.id)
    .maybeSingle() as { data: { id: string; user_id: string; phone: string | null; email: string | null; full_name: string } | null; error: unknown }

  if (fetchError || !profile) {
    return NextResponse.json({ error: 'Shadchan profile not found' }, { status: 404 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: profileError } = await (adminClient.from('shadchan_profiles') as any)
    .update({
      is_approved: true,
      approved_at: new Date().toISOString(),
      approved_by_admin_id: user.id,
    })
    .eq('id', profile.id)

  if (profileError) {
    return NextResponse.json({ error: (profileError as { message: string }).message }, { status: 500 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: userError } = await (adminClient.from('users') as any)
    .update({ status: 'active' })
    .eq('id', profile.user_id)

  if (userError) {
    return NextResponse.json({ error: (userError as { message: string }).message }, { status: 500 })
  }

  // In-app notification
  await createNotification(profile.user_id, 'shadchan_approved', {
    message: 'Your shadchan application has been approved. You can now log in.',
    link: '/dashboard',
  })

  // Email + SMS — fire after the main operation, never block on failure
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userRow } = await (adminClient.from('users') as any)
      .select('email, email_notifications, sms_notifications')
      .eq('id', profile.user_id)
      .maybeSingle() as { data: { email: string | null; email_notifications: boolean; sms_notifications: boolean } | null }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mymatsh.com'
    const toEmail = userRow?.email ?? profile.email
    const toPhone = profile.phone

    if (userRow?.email_notifications !== false && toEmail) {
      const html = emailTemplate(
        `<p>Shalom ${profile.full_name || 'there'},</p>
         <p>We are pleased to let you know that your MyMatSH shadchan application has been <strong>approved</strong>.</p>
         <p>You can now log in to your dashboard and start managing your singles.</p>`,
        'Go to My Dashboard',
        `${appUrl}/dashboard`
      )
      await sendEmail(toEmail, 'Welcome to MyMatSH — Your Application is Approved', html)
    }

    if (userRow?.sms_notifications !== false && toPhone) {
      await sendSms(toPhone, `MyMatSH: Your shadchan application has been approved! Log in at ${appUrl}`)
    }
  } catch (err) {
    console.error('[approve-shadchan] notification delivery error:', err)
  }

  return NextResponse.json({ ok: true })
}
