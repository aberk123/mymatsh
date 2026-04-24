import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/database'

export async function POST(request: Request) {
  try {
    const { email } = await request.json() as { email?: string }

    if (!email?.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch { /* ignore */ }
          },
        },
      }
    )

    // Use the configured app URL, falling back to the Vercel URL if still pointing at localhost
    const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
    const appUrl =
      rawAppUrl && !rawAppUrl.startsWith('http://localhost') && !rawAppUrl.startsWith('http://127.')
        ? rawAppUrl
        : 'https://mymatsh.vercel.app'

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${appUrl}/reset-password`,
    })

    if (error) {
      console.error('[forgot-password] resetPasswordForEmail error:', error.message, '| redirectTo:', `${appUrl}/reset-password`)
    }

    // Always return ok — never reveal whether the email exists
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[forgot-password] unexpected error:', err)
    return NextResponse.json({ ok: true })
  }
}
