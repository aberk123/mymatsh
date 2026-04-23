import { createServerClient } from '@supabase/ssr'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

async function getAuthUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// POST — idempotent: returns existing singles record or creates a blank one
export async function POST() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = serviceClient()

  // Check for existing record
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (admin.from('singles') as any)
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle() as { data: { id: string } | null }

  if (existing) {
    return NextResponse.json({ id: existing.id, created: false })
  }

  // Extract name/email/phone from auth metadata
  const meta = (user.user_metadata ?? {}) as Record<string, string>
  const firstName = meta.first_name ?? ''
  const lastName = meta.last_name ?? ''
  const email = user.email ?? null
  const phone = user.phone ?? null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: created, error } = await (admin.from('singles') as any)
    .insert({
      user_id: user.id,
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      status: 'draft',
    })
    .select('id')
    .single() as { data: { id: string } | null; error: unknown }

  if (error || !created) {
    if (process.env.NODE_ENV === 'development') console.error('[ensure-profile] insert error:', error)
    return NextResponse.json({ error: 'Failed to create profile record' }, { status: 500 })
  }

  return NextResponse.json({ id: created.id, created: true })
}
