import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { type Database } from '@/types/database'

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const callerClient = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cs) {
          try { cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) }
          catch { /* ignore */ }
        },
      },
    }
  )

  const { data: { user: caller } } = await callerClient.auth.getUser()
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: callerRow } = await callerClient.from('users').select('role').eq('id', caller.id).maybeSingle()
  if ((callerRow as { role: string } | null)?.role !== 'platform_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json() as {
    firstName: string; lastName: string; email?: string; phone?: string
    city?: string; state?: string; yearsExperience?: string; reference?: string; password: string
  }

  const cleanEmail = body.email?.trim() || undefined
  const cleanPhone = body.phone?.trim() || undefined

  if (!body.firstName?.trim() || !body.lastName?.trim()) {
    return NextResponse.json({ error: 'First and last name are required' }, { status: 400 })
  }
  if (!cleanEmail && !cleanPhone) {
    return NextResponse.json({ error: 'Email or phone is required' }, { status: 400 })
  }
  if (!body.password || body.password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const admin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: newUser, error: authError } = await admin.auth.admin.createUser({
    ...(cleanEmail ? { email: cleanEmail } : {}),
    ...(cleanPhone ? { phone: cleanPhone } : {}),
    password: body.password,
    email_confirm: true,
    phone_confirm: true,
    user_metadata: { first_name: body.firstName.trim(), last_name: body.lastName.trim() },
  })
  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: userError } = await (admin.from('users') as any)
    .insert({ id: newUser.user.id, email: cleanEmail ?? null, phone: cleanPhone ?? null, role: 'shadchan', status: 'active' })
  if (userError) {
    await admin.auth.admin.deleteUser(newUser.user.id)
    return NextResponse.json({ error: userError.message }, { status: 400 })
  }

  const fullName = `${body.firstName.trim()} ${body.lastName.trim()}`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: newProfile, error: profileError } = await (admin.from('shadchan_profiles') as any)
    .insert({
      user_id: newUser.user.id,
      full_name: fullName,
      email: cleanEmail ?? null,
      phone: cleanPhone ?? null,
      city: body.city?.trim() || null,
      state: body.state?.trim() || null,
      years_experience: body.yearsExperience || null,
      reference_1: body.reference?.trim() || null,
      is_approved: true,
      approved_at: new Date().toISOString(),
      approved_by_admin_id: caller.id,
      created_by_admin_id: caller.id,
    })
    .select('id').single() as { data: { id: string } | null; error: unknown }

  if (profileError) {
    await admin.auth.admin.deleteUser(newUser.user.id)
    return NextResponse.json({ error: (profileError as { message: string }).message }, { status: 400 })
  }

  return NextResponse.json({ id: newProfile!.id, name: fullName }, { status: 201 })
}
