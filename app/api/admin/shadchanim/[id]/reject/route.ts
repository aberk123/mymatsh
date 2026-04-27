import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { type Database } from '@/types/database'
import { sendEmail } from '@/lib/utils/send-email'
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

  // Fetch contact details before deleting
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: userRow } = await (adminClient.from('users') as any)
    .select('email')
    .eq('id', params.id)
    .maybeSingle() as { data: { email: string | null } | null }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (adminClient.from('shadchan_profiles') as any)
    .select('email, full_name')
    .eq('user_id', params.id)
    .maybeSingle() as { data: { email: string | null; full_name: string } | null }

  // Delete shadchan_profiles row
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (adminClient.from('shadchan_profiles') as any).delete().eq('user_id', params.id)

  // Delete from public.users
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: userError } = await (adminClient.from('users') as any)
    .delete()
    .eq('id', params.id)

  if (userError) {
    console.error('[reject] users delete error:', userError)
    return NextResponse.json({ error: (userError as { message: string }).message }, { status: 500 })
  }

  // Delete from Supabase Auth
  await adminClient.auth.admin.deleteUser(params.id)

  // Send rejection email — fire after all deletes, never block on failure
  try {
    const toEmail = userRow?.email ?? profile?.email
    const fullName = profile?.full_name || 'there'
    if (toEmail) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mymatsh.com'
      const html = emailTemplate(
        `<p>Shalom ${fullName},</p>
         <p>Thank you for your interest in joining MyMatSH as a shadchan.</p>
         <p>After reviewing your application, we are unable to approve it at this time.</p>
         <p>If you have questions, please reply to this email or contact us at support@mymatsh.com.</p>`,
        'Visit MyMatSH',
        appUrl
      )
      await sendEmail(toEmail, 'MyMatSH — Shadchan Application Update', html)
    }
  } catch (err) {
    console.error('[reject-shadchan] email error:', err)
  }

  return NextResponse.json({ ok: true })
}
