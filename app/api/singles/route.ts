import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { type Database } from '@/types/database'

interface SingleForDupCheck {
  id: string
  first_name: string
  last_name: string
  age: number | null
  dob: string | null
  phone: string | null
  birth_month: string | null
  city: string | null
  state: string | null
  address: string | null
  height_inches: number | null
  current_yeshiva_seminary: string | null
  eretz_yisroel: string | null
  plans: string | null
  looking_for: string | null
  family_background: string | null
  siblings: string | null
  about_bio: string | null
  photo_url: string | null
}

const MERGE_FIELDS: Record<string, string> = {
  phone: 'Phone', dob: 'Date of birth', age: 'Age', birth_month: 'Birth month',
  city: 'City', state: 'State', address: 'Address', height_inches: 'Height',
  current_yeshiva_seminary: 'Yeshiva / Seminary', eretz_yisroel: 'Eretz Yisroel',
  plans: 'Plans', looking_for: 'Looking for', family_background: 'Family background',
  siblings: 'Siblings', about_bio: 'Bio', photo_url: 'Photo',
}

function secondaryMatch(incoming: Record<string, unknown>, existing: SingleForDupCheck): boolean {
  const iAge = typeof incoming.age === 'number' ? incoming.age : null
  const iDob = typeof incoming.dob === 'string' ? incoming.dob : null
  const iPhone = typeof incoming.phone === 'string' ? incoming.phone : null
  if (iAge !== null && existing.age !== null && Math.abs(iAge - existing.age) <= 1) return true
  if (iDob && existing.dob && iDob === existing.dob) return true
  if (iPhone && existing.phone) {
    const p1 = iPhone.replace(/\D/g, ''), p2 = existing.phone.replace(/\D/g, '')
    if (p1.length >= 10 && p1 === p2) return true
  }
  return false
}

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

  const body = await request.json() as Record<string, unknown>
  const firstName = typeof body.first_name === 'string' ? body.first_name.trim() : ''
  const lastName = typeof body.last_name === 'string' ? body.last_name.trim() : ''

  // Duplicate detection: look for name matches
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: nameMatches } = await (adminClient.from('singles') as any)
    .select('id, first_name, last_name, age, dob, phone, birth_month, city, state, address, height_inches, current_yeshiva_seminary, eretz_yisroel, plans, looking_for, family_background, siblings, about_bio, photo_url')
    .ilike('first_name', firstName)
    .ilike('last_name', lastName) as { data: SingleForDupCheck[] | null }

  const matches = nameMatches ?? []
  const confirmed = matches.find(ex => secondaryMatch(body, ex))
  const nameOnlyMatch = !confirmed && matches.length > 0 ? matches[0] : null

  if (confirmed) {
    // Merge: only fill blank fields
    const updates: Record<string, unknown> = {}
    const fieldsAdded: string[] = []
    const fieldsSkipped: string[] = []

    for (const [field, label] of Object.entries(MERGE_FIELDS)) {
      const incoming = body[field]
      const existing = (confirmed as unknown as Record<string, unknown>)[field]
      const hasIncoming = incoming !== null && incoming !== undefined && incoming !== ''
      const hasExisting = existing !== null && existing !== undefined && existing !== ''
      if (hasIncoming && !hasExisting) {
        updates[field] = incoming
        fieldsAdded.push(label)
      } else if (hasIncoming && hasExisting) {
        fieldsSkipped.push(label)
      }
    }

    if (Object.keys(updates).length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (adminClient.from('singles') as any)
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', confirmed.id)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (adminClient.from('shadchan_singles') as any)
      .upsert({ shadchan_id: profile.id, single_id: confirmed.id }, { onConflict: 'shadchan_id,single_id' })

    return NextResponse.json({
      id: confirmed.id,
      status: 'merged',
      fields_added: fieldsAdded,
      fields_skipped: fieldsSkipped,
    })
  }

  // Insert new single
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: newSingle, error } = await (adminClient.from('singles') as any)
    .insert({ ...body, created_by_shadchan_id: profile.id })
    .select('id')
    .single() as { data: { id: string } | null; error: unknown }

  if (error) {
    return NextResponse.json({ error: (error as { message: string }).message }, { status: 500 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (adminClient.from('shadchan_singles') as any)
    .insert({ shadchan_id: profile.id, single_id: newSingle!.id })

  return NextResponse.json({
    id: newSingle!.id,
    status: 'created',
    ...(nameOnlyMatch ? { possibleDuplicate: { id: nameOnlyMatch.id, name: `${nameOnlyMatch.first_name} ${nameOnlyMatch.last_name}` } } : {}),
  })
}
