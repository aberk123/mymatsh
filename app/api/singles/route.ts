import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { type Database } from '@/types/database'

export async function GET(request: Request) {
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

  const role = (callerRow as { role: string } | null)?.role
  if (role !== 'shadchan' && role !== 'platform_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const adminClient = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { searchParams } = new URL(request.url)
  const tab = searchParams.get('tab') ?? 'mine'
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page') ?? '20', 10)))
  const search = (searchParams.get('search') ?? '').trim()
  const genderParam = searchParams.get('gender') ?? ''
  const hashkafa = searchParams.get('hashkafa') ?? ''
  const statusParam = searchParams.get('status') ?? ''
  const labelFilter = searchParams.get('label') ?? ''
  const starredOnly = searchParams.get('starred') === 'true'
  const ageMin = searchParams.get('age_min') ? parseInt(searchParams.get('age_min')!, 10) : null
  const ageMax = searchParams.get('age_max') ? parseInt(searchParams.get('age_max')!, 10) : null
  const heightMin = searchParams.get('height_min') ? parseInt(searchParams.get('height_min')!, 10) : null
  const heightMax = searchParams.get('height_max') ? parseInt(searchParams.get('height_max')!, 10) : null

  // Get shadchan profile ID
  let profileId: string | null = null
  if (role === 'shadchan') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (adminClient.from('shadchan_profiles') as any)
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle() as { data: { id: string } | null }
    if (!profile) return NextResponse.json({ error: 'Shadchan profile not found' }, { status: 404 })
    profileId = profile.id
  }

  // Shadchan's label list (used for filter dropdown)
  let labelsList: string[] = []
  if (profileId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: labelsData } = await (adminClient.from('labels') as any)
      .select('name')
      .eq('shadchan_id', profileId)
      .order('name') as { data: Array<{ name: string }> | null }
    labelsList = (labelsData ?? []).map((l: { name: string }) => l.name)
  }

  // Resolve label filter to single_ids
  let labelFilterIds: string[] | null = null
  if (labelFilter && profileId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: labelRow } = await (adminClient.from('labels') as any)
      .select('id')
      .eq('shadchan_id', profileId)
      .eq('name', labelFilter)
      .maybeSingle() as { data: { id: string } | null }
    if (labelRow) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: slData } = await (adminClient.from('single_labels') as any)
        .select('single_id')
        .eq('label_id', labelRow.id) as { data: Array<{ single_id: string }> | null }
      labelFilterIds = (slData ?? []).map((sl: { single_id: string }) => sl.single_id)
    } else {
      labelFilterIds = []
    }
  }

  if (labelFilterIds !== null && labelFilterIds.length === 0) {
    return NextResponse.json({ singles: [], total: 0, page, per_page: perPage, total_pages: 0, labels_list: labelsList })
  }

  // Starred filter
  let starredIds: string[] | null = null
  if (starredOnly && profileId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: starData } = await (adminClient.from('single_stars') as any)
      .select('single_id').eq('shadchan_id', profileId) as { data: Array<{ single_id: string }> | null }
    starredIds = (starData ?? []).map((s: { single_id: string }) => s.single_id)
    if (starredIds.length === 0) {
      return NextResponse.json({ singles: [], total: 0, page, per_page: perPage, total_pages: 0, labels_list: labelsList })
    }
  }

  const from = (page - 1) * perPage
  const to = from + perPage - 1

  // Build base query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any

  if (role === 'platform_admin') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query = (adminClient.from('singles') as any)
      .select('id, first_name, last_name, gender, age, city, state, status, hashkafa, plans, height_inches, created_at, created_by_shadchan_id', { count: 'exact' })
  } else if (tab === 'mine') {
    // Union: created by this shadchan OR linked via junction table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: junctionData } = await (adminClient.from('shadchan_singles') as any)
      .select('single_id')
      .eq('shadchan_id', profileId) as { data: Array<{ single_id: string }> | null }
    const junctionIds = (junctionData ?? []).map((j: { single_id: string }) => j.single_id)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query = (adminClient.from('singles') as any)
      .select('id, first_name, last_name, gender, age, city, state, status, hashkafa, plans, height_inches, created_at', { count: 'exact' })

    if (junctionIds.length > 0) {
      query = query.or(`created_by_shadchan_id.eq.${profileId},id.in.(${junctionIds.join(',')})`)
    } else {
      query = query.eq('created_by_shadchan_id', profileId)
    }
  } else {
    // All available singles (shadchan 'all' tab)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query = (adminClient.from('singles') as any)
      .select('id, first_name, last_name, gender, age, city, state, hashkafa, plans, height_inches, created_at, created_by_shadchan_id', { count: 'exact' })
      .eq('status', 'available')
  }

  // Apply shared filters
  if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,city.ilike.%${search}%,plans.ilike.%${search}%`)
  }
  if (genderParam === 'male' || genderParam === 'female') {
    query = query.eq('gender', genderParam)
  }
  if (hashkafa) {
    query = query.eq('hashkafa', hashkafa)
  }
  if (statusParam && (tab === 'mine' || role === 'platform_admin')) {
    query = query.eq('status', statusParam)
  }
  if (ageMin !== null && !isNaN(ageMin)) query = query.gte('age', ageMin)
  if (ageMax !== null && !isNaN(ageMax)) query = query.lte('age', ageMax)
  if (heightMin !== null && heightMin > 0 && !isNaN(heightMin)) query = query.gte('height_inches', heightMin)
  if (heightMax !== null && heightMax > 0 && !isNaN(heightMax)) query = query.lte('height_inches', heightMax)
  if (labelFilterIds !== null && labelFilterIds.length > 0) query = query.in('id', labelFilterIds)
  if (starredIds !== null && starredIds.length > 0) query = query.in('id', starredIds)

  query = tab === 'mine'
    ? query.order('created_at', { ascending: false })
    : query.order('first_name', { ascending: true })

  query = query.range(from, to)

  const { data: singlesData, count, error } = await query
  if (error) {
    return NextResponse.json({ error: (error as { message: string }).message }, { status: 500 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: any[] = singlesData ?? []
  const total = count ?? 0

  // Resolve shadchan names for all/admin tabs
  const shadchanMap: Record<string, string> = {}
  if ((tab === 'all' || role === 'platform_admin') && rows.length > 0) {
    const shadchanIds = Array.from(new Set(rows.map((s) => s.created_by_shadchan_id).filter(Boolean)))
    if (shadchanIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profs } = await (adminClient.from('shadchan_profiles') as any)
        .select('id, full_name')
        .in('id', shadchanIds) as { data: Array<{ id: string; full_name: string }> | null }
      for (const p of profs ?? []) shadchanMap[p.id] = p.full_name
    }
  }

  // Attach this shadchan's labels to the returned singles
  const labelsBySingle: Record<string, string[]> = {}
  if (profileId && rows.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: myLabels } = await (adminClient.from('labels') as any)
      .select('id, name')
      .eq('shadchan_id', profileId) as { data: Array<{ id: string; name: string }> | null }
    const labelById: Record<string, string> = {}
    for (const l of myLabels ?? []) labelById[l.id] = l.name

    if (Object.keys(labelById).length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: slData } = await (adminClient.from('single_labels') as any)
        .select('single_id, label_id')
        .in('single_id', rows.map((s) => s.id))
        .in('label_id', Object.keys(labelById)) as { data: Array<{ single_id: string; label_id: string }> | null }
      for (const sl of slData ?? []) {
        if (!labelsBySingle[sl.single_id]) labelsBySingle[sl.single_id] = []
        const name = labelById[sl.label_id]
        if (name) labelsBySingle[sl.single_id].push(name)
      }
    }
  }

  // Starred singles for this shadchan
  const starredSet = new Set<string>()
  if (profileId && rows.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: starData } = await (adminClient.from('single_stars') as any)
      .select('single_id')
      .eq('shadchan_id', profileId)
      .in('single_id', rows.map((s) => s.id)) as { data: Array<{ single_id: string }> | null }
    for (const s of starData ?? []) starredSet.add(s.single_id)
  }

  // Representation request status (all tab only)
  const repMap: Record<string, string> = {}
  if (tab === 'all' && profileId && rows.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: repData } = await (adminClient.from('representation_requests') as any)
      .select('single_id, status')
      .eq('shadchan_id', profileId)
      .in('single_id', rows.map((s) => s.id)) as { data: Array<{ single_id: string; status: string }> | null }
    for (const r of repData ?? []) repMap[r.single_id] = r.status
  }

  return NextResponse.json({
    singles: rows.map((s) => ({
      id: s.id,
      first_name: s.first_name,
      last_name: s.last_name,
      gender: s.gender,
      age: s.age,
      city: s.city,
      state: s.state,
      status: s.status ?? null,
      hashkafa: s.hashkafa,
      plans: s.plans,
      height_inches: s.height_inches,
      created_at: s.created_at,
      shadchan_name: shadchanMap[s.created_by_shadchan_id] ?? '—',
      labels: labelsBySingle[s.id] ?? [],
      rep_status: repMap[s.id] ?? null,
      is_starred: starredSet.has(s.id),
    })),
    total,
    page,
    per_page: perPage,
    total_pages: Math.ceil(total / perPage),
    labels_list: labelsList,
  })
}

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
