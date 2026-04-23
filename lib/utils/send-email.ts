import { Resend } from 'resend'

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!to) return

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[sendEmail] DEV — TO: ${to} | SUBJECT: ${subject}\n${html.slice(0, 300)}…`)
    return
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('[sendEmail] RESEND_API_KEY not set — skipping')
    return
  }

  const from = process.env.RESEND_FROM_EMAIL ?? 'MyMatSH <noreply@mymatsh.com>'

  try {
    const resend = new Resend(apiKey)
    await resend.emails.send({ from, to, subject, html })
  } catch (err) {
    console.error('[sendEmail] failed:', err)
  }
}
