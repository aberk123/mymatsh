import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { type Database } from '@/types/database'

function mask(val: string | null | undefined): string {
  if (!val) return ''
  if (val.includes('@')) {
    const [local, domain] = val.split('@')
    const visible = local.slice(0, Math.min(3, local.length))
    return `${visible}***@${domain}`
  }
  // phone: show last 4 digits
  const digits = val.replace(/\D/g, '')
  return `***-***-${digits.slice(-4)}`
}

export async function POST(req: Request) {
  // No auth required — called before signup
  const admin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { first_name, last_name } = await req.json() as { first_name: string; last_name: string }
  if (!first_name?.trim() || !last_name?.trim()) {
    return NextResponse.json({ match: null })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin.from('singles') as any)
    .select('id, first_name, last_name, email, phone, user_id')
    .ilike('first_name', first_name.trim())
    .ilike('last_name', last_name.trim())
    .is('user_id', null)
    .maybeSingle() as {
      data: { id: string; first_name: string; last_name: string; email: string | null; phone: string | null; user_id: string | null } | null
    }

  if (!data) return NextResponse.json({ match: null })

  return NextResponse.json({
    match: {
      id: data.id,
      name: `${data.first_name} ${data.last_name}`,
      masked_email: mask(data.email),
      masked_phone: mask(data.phone),
    },
  })
}

// Called after signup to link existing single record to the new user
export async function PATCH(req: Request) {
  const cookieStore = await cookies()
  const callerClient = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )
  const { data: { user } } = await callerClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { single_id } = await req.json() as { single_id: string }
  if (!single_id) return NextResponse.json({ error: 'single_id required' }, { status: 400 })

  const admin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Ensure the single has no existing user_id (unclaimed)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (admin.from('singles') as any)
    .select('user_id').eq('id', single_id).maybeSingle() as { data: { user_id: string | null } | null }

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.user_id && existing.user_id !== user.id) {
    return NextResponse.json({ error: 'Already claimed' }, { status: 409 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin.from('singles') as any).update({ user_id: user.id }).eq('id', single_id)

  return NextResponse.json({ ok: true })
}
