import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { type Database } from '@/types/database'
import { createNotification } from '@/lib/utils/notifications'
import { sendEmail } from '@/lib/utils/send-email'
import { sendSms } from '@/lib/utils/send-sms'
import { emailTemplate } from '@/lib/utils/email-template'

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

  // Notifications — fire after the main operation
  if (newMatch) {
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mymatsh.com'

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: singles } = await (adminClient.from('singles') as any)
        .select('id, user_id, first_name, last_name, email, phone')
        .in('id', [boy_id, girl_id]) as {
          data: { id: string; user_id: string | null; first_name: string; last_name: string; email: string | null; phone: string | null }[] | null
        }

      for (const s of singles ?? []) {
        // In-app notification (portal users only)
        if (s.user_id) {
          await createNotification(s.user_id, 'match_suggested', {
            match_id: newMatch.id,
            message: 'A new match has been suggested for you.',
            link: '/portal/single/matches',
          })

          // Check prefs for portal users
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: prefs } = await (adminClient.from('users') as any)
            .select('email_notifications, sms_notifications')
            .eq('id', s.user_id)
            .maybeSingle() as { data: { email_notifications: boolean; sms_notifications: boolean } | null }

          if (prefs?.email_notifications !== false && s.email) {
            const html = emailTemplate(
              `<p>Shalom ${s.first_name},</p>
               <p>You have a new shidduch suggestion on MyMatSH.</p>
               <p>Log in to your portal to view the details.</p>`,
              'View My Suggestions',
              `${appUrl}/portal/single/matches`
            )
            await sendEmail(s.email, 'You have a new suggestion on MyMatSH', html)
          }

          if (prefs?.sms_notifications !== false && s.phone) {
            await sendSms(s.phone, `MyMatSH: You have a new shidduch suggestion. Log in to view it at ${appUrl}`)
          }
        } else if (s.email || s.phone) {
          // Single without a portal account — send directly if contact info available
          if (s.email) {
            const html = emailTemplate(
              `<p>Shalom ${s.first_name},</p>
               <p>You have a new shidduch suggestion on MyMatSH.</p>
               <p>Contact your shadchan for details.</p>`,
              'Go to MyMatSH',
              appUrl
            )
            await sendEmail(s.email, 'You have a new suggestion on MyMatSH', html)
          }
          if (s.phone) {
            await sendSms(s.phone, `MyMatSH: You have a new shidduch suggestion. Contact your shadchan for details.`)
          }
        }

        // Notify the single's parent(s) if linked
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: parents } = await (adminClient.from('parents') as any)
          .select('user_id, email, phone, full_name')
          .eq('child_id', s.id) as {
            data: { user_id: string; email: string | null; phone: string | null; full_name: string }[] | null
          }

        for (const p of parents ?? []) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: parentPrefs } = await (adminClient.from('users') as any)
            .select('email_notifications, sms_notifications')
            .eq('id', p.user_id)
            .maybeSingle() as { data: { email_notifications: boolean; sms_notifications: boolean } | null }

          if (parentPrefs?.email_notifications !== false && p.email) {
            const html = emailTemplate(
              `<p>Shalom ${p.full_name || 'there'},</p>
               <p>A new shidduch suggestion has been made for your child on MyMatSH.</p>
               <p>Log in to your parent portal to view the details.</p>`,
              'View Suggestion',
              `${appUrl}/portal/parent/matches`
            )
            await sendEmail(p.email, 'You have a new suggestion on MyMatSH', html)
          }

          if (parentPrefs?.sms_notifications !== false && p.phone) {
            await sendSms(p.phone, `MyMatSH: You have a new shidduch suggestion. Log in to view it at ${appUrl}`)
          }
        }
      }
    } catch (err) {
      console.error('[matches] notification delivery error:', err)
    }
  }

  return NextResponse.json({ id: newMatch?.id })
}
