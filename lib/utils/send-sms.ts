import twilio from 'twilio'

function toE164(phone: string): string | null {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  if (digits.length > 11) return `+${digits}` // pass through international numbers
  return null
}

export async function sendSms(to: string, body: string): Promise<void> {
  const normalized = toE164(to)
  if (!normalized) {
    console.error(`[sendSms] invalid phone number: "${to}" — skipping`)
    return
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[sendSms] DEV — TO: ${normalized} | BODY: ${body}`)
    return
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_PHONE_NUMBER
  if (!accountSid || !authToken || !from) {
    console.error('[sendSms] Twilio credentials not set — skipping')
    return
  }

  try {
    const client = twilio(accountSid, authToken)
    await client.messages.create({ body, from, to: normalized })
  } catch (err) {
    console.error('[sendSms] failed:', err)
  }
}
