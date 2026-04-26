import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { type Database } from '@/types/database'

interface CsvRow {
  first_name: string
  last_name: string
  gender?: string
  email?: string
  phone?: string
  city?: string
  state?: string
  age?: string | number
  dob?: string
  height_inches?: string | number
  hashkafa?: string
  plans?: string
  about_bio?: string
  looking_for?: string
  family_background?: string
  current_yeshiva_seminary?: string
  eretz_yisroel?: string
  address?: string
  country?: string
  occupation?: string
  full_hebrew_name?: string
}

function normalizeGender(v: string | undefined): 'male' | 'female' | null {
  if (!v) return null
  const lower = v.toLowerCase().trim()
  if (lower === 'male' || lower === 'm' || lower === 'boy' || lower === 'boys') return 'male'
  if (lower === 'female' || lower === 'f' || lower === 'girl' || lower === 'girls') return 'female'
  return null
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
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) }
          catch { /* ignore */ }
        },
      },
    }
  )

  const { data: { user } } = await callerClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: callerRow } = await callerClient.from('users').select('role').eq('id', user.id).maybeSingle()
  if ((callerRow as { role: string } | null)?.role !== 'platform_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const adminClient = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const body = await request.json() as { rows: CsvRow[]; shadchan_id?: string }
  const { rows, shadchan_id } = body

  if (!Array.isArray(rows) || rows.length === 0) return NextResponse.json({ error: 'No rows provided' }, { status: 400 })

  let imported = 0
  let duplicates = 0
  let errors = 0
  let unassigned = 0
  const errorDetails: string[] = []

  for (const row of rows) {
    const fn = String(row.first_name ?? '').trim()
    const ln = String(row.last_name ?? '').trim()

    if (!fn || !ln) {
      errors++
      errorDetails.push(`Row missing name: ${JSON.stringify(row).slice(0, 80)}`)
      continue
    }

    const gender = normalizeGender(row.gender as string | undefined)
    if (!gender) {
      errors++
      errorDetails.push(`${fn} ${ln}: invalid or missing gender "${row.gender}"`)
      continue
    }

    // Duplicate check: same first + last name (case-insensitive)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (adminClient.from('singles') as any)
      .select('id')
      .ilike('first_name', fn)
      .ilike('last_name', ln)
      .maybeSingle() as { data: { id: string } | null }

    if (existing) {
      duplicates++
      continue
    }

    const record: Record<string, unknown> = {
      first_name: fn,
      last_name: ln,
      gender,
      created_by_shadchan_id: shadchan_id || null,
      status: 'draft',
      source: 'csv_import',
    }

    if (row.email?.trim()) record.email = row.email.trim()
    if (row.phone?.trim()) record.phone = row.phone.trim()
    if (row.city?.trim()) record.city = row.city.trim()
    if (row.state?.trim()) record.state = row.state.trim()
    if (row.address?.trim()) record.address = row.address.trim()
    if (row.country?.trim()) record.country = row.country.trim()
    if (row.occupation?.trim()) record.occupation = row.occupation.trim()
    if (row.full_hebrew_name?.trim()) record.full_hebrew_name = row.full_hebrew_name.trim()
    if (row.hashkafa?.trim()) record.hashkafa = row.hashkafa.trim()
    if (row.plans?.trim()) record.plans = row.plans.trim()
    if (row.about_bio?.trim()) record.about_bio = row.about_bio.trim()
    if (row.looking_for?.trim()) record.looking_for = row.looking_for.trim()
    if (row.family_background?.trim()) record.family_background = row.family_background.trim()
    if (row.current_yeshiva_seminary?.trim()) record.current_yeshiva_seminary = row.current_yeshiva_seminary.trim()
    if (row.eretz_yisroel?.trim()) record.eretz_yisroel = row.eretz_yisroel.trim()
    if (row.dob?.trim()) record.dob = row.dob.trim()

    const ageVal = row.age !== undefined && row.age !== '' ? parseInt(String(row.age), 10) : null
    if (ageVal !== null && !isNaN(ageVal) && ageVal > 0) record.age = ageVal

    const heightVal = row.height_inches !== undefined && row.height_inches !== '' ? parseInt(String(row.height_inches), 10) : null
    if (heightVal !== null && !isNaN(heightVal) && heightVal > 0) record.height_inches = heightVal

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = await (adminClient.from('singles') as any).insert(record)
    if (insertError) {
      errors++
      errorDetails.push(`${fn} ${ln}: ${(insertError as { message: string }).message}`)
    } else {
      imported++
      if (!shadchan_id) unassigned++
    }
  }

  return NextResponse.json({ imported, duplicates, errors, unassigned, error_details: errorDetails.slice(0, 20) })
}
