import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/database'
import { notifyAllAdmins } from '@/lib/utils/notifications'
import { sendEmail } from '@/lib/utils/send-email'
import { emailTemplate } from '@/lib/utils/email-template'

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    const body = await request.json() as { comments?: string }

    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: batch, error: fetchErr } = await (supabase.from('import_batches') as any)
      .select('id, status')
      .eq('review_token', token)
      .maybeSingle() as { data: { id: string; status: string } | null; error: unknown }

    if (fetchErr) throw fetchErr
    if (!batch) return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
    if (batch.status === 'admin_approved' || batch.status === 'rejected') {
      return NextResponse.json({ error: 'Batch is already finalized' }, { status: 409 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateErr } = await (supabase.from('import_batches') as any)
      .update({
        status: 'shadchan_approved',
        shadchan_comments: body.comments?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', batch.id)

    if (updateErr) throw updateErr

    // In-app notification to all admins
    await notifyAllAdmins('import_batch_approved', {
      batch_id: batch.id,
      message: 'An import batch has been approved by the shadchan and is ready for admin review.',
      link: `/admin/import-batches/${batch.id}`,
    })

    // Email to all admins — service role needed for user lookups
    try {
      const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      )

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: admins } = await (adminClient.from('users') as any)
        .select('id, email, email_notifications')
        .eq('role', 'platform_admin') as { data: { id: string; email: string | null; email_notifications: boolean }[] | null }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mymatsh.com'

      for (const admin of admins ?? []) {
        if (admin.email_notifications === false || !admin.email) continue
        const html = emailTemplate(
          `<p>A shadchan has approved an import batch and it is ready for your review.</p>
           <p>Batch ID: <code style="background:#f4f4f4;padding:2px 6px;border-radius:4px;font-size:13px;">${batch.id}</code></p>
           <p>Log in to the admin panel to review and approve the import.</p>`,
          'Review Import Batch',
          `${appUrl}/admin/import-batches/${batch.id}`
        )
        await sendEmail(admin.email, 'Import Batch Ready for Review', html)
      }
    } catch (err) {
      console.error('[review-approve] admin email error:', err)
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
