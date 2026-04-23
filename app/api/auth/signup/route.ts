import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { type Database } from '@/types/database'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      role,
      firstName,
      lastName,
      email,
      phone,
      password,
      city,
      state,
      yearsExperience,
      expertise,
      ageBracket,
      contactPref,
      bestDay,
      bestTime,
      reference,
    } = body

    if (!role || !password) {
      return NextResponse.json({ error: 'Role and password are required' }, { status: 400 })
    }

    if (!email?.trim() && !phone?.trim()) {
      return NextResponse.json({ error: 'Email or phone is required' }, { status: 400 })
    }

    const cookieStore = await cookies()

    // Use service role key to bypass RLS for user creation
    const adminClient = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() {},
        },
      }
    )

    // shadchan accounts start as pending, all others as active
    const status = role === 'shadchan' ? 'pending' : 'active'

    // user_metadata is JSON — arrays are stored as-is
    const metadata: Record<string, unknown> = {
      first_name: firstName ?? '',
      last_name: lastName ?? '',
    }
    if (role === 'shadchan') {
      if (city) metadata.city = city
      if (state) metadata.state = state
      if (yearsExperience) metadata.years_experience = yearsExperience
      if (expertise) metadata.expertise = expertise
      // ageBracket, contactPref, bestDay are now string[] from the multi-select UI
      if (Array.isArray(ageBracket) && ageBracket.length > 0) metadata.age_bracket = ageBracket
      if (Array.isArray(contactPref) && contactPref.length > 0) metadata.contact_pref = contactPref
      if (Array.isArray(bestDay) && bestDay.length > 0) metadata.best_day = bestDay
      if (bestTime) metadata.best_time = bestTime
      if (reference) metadata.reference = reference
    }

    const createArgs: Parameters<typeof adminClient.auth.admin.createUser>[0] = {
      password,
      user_metadata: metadata,
      email_confirm: true,
      phone_confirm: true,
    }
    if (email?.trim()) createArgs.email = email.trim()
    if (phone?.trim()) createArgs.phone = phone.trim()

    const { data, error } = await adminClient.auth.admin.createUser(createArgs)

    if (error || !data.user) {
      return NextResponse.json({ error: error?.message ?? 'Failed to create user' }, { status: 400 })
    }

    // Insert into public.users
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: dbError } = await (adminClient.from('users') as any).insert({
      id: data.user.id,
      role,
      status,
      email: email?.trim() || null,
      phone: phone?.trim() || null,
    })

    if (dbError) {
      // Roll back auth user
      await adminClient.auth.admin.deleteUser(data.user.id)
      return NextResponse.json({ error: 'Failed to save user profile' }, { status: 500 })
    }

    // For shadchanim: create shadchan_profiles row so they appear in the admin pending list
    if (role === 'shadchan') {
      const fullName = [firstName, lastName].filter(Boolean).join(' ').trim() || 'Unknown'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: profileError } = await (adminClient.from('shadchan_profiles') as any).insert({
        user_id: data.user.id,
        full_name: fullName,
        city: city?.trim() || null,
        state: state?.trim() || null,
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        years_experience: yearsExperience || null,
        age_bracket: Array.isArray(ageBracket) ? ageBracket : [],
        best_contact_method: Array.isArray(contactPref) ? contactPref : [],
        best_day: Array.isArray(bestDay) ? bestDay : [],
        best_time: bestTime || null,
        type_of_service: expertise?.trim() || null,
        reference_1: reference?.trim() || null,
        is_approved: false,
      })
      if (profileError) {
        // Roll back auth user and users row
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (adminClient.from('users') as any).delete().eq('id', data.user.id)
        await adminClient.auth.admin.deleteUser(data.user.id)
        return NextResponse.json({ error: 'Failed to create shadchan profile' }, { status: 500 })
      }
    }

    // For singles: create a linked singles record immediately so the profile page works
    if (role === 'single') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: singleError } = await (adminClient.from('singles') as any).insert({
        user_id: data.user.id,
        first_name: firstName ?? '',
        last_name: lastName ?? '',
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        status: 'draft',
      })
      if (singleError && process.env.NODE_ENV === 'development') {
        console.error('[signup] failed to create singles record:', singleError)
      }
    }

    return NextResponse.json({ ok: true, status })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
