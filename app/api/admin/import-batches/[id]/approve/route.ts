import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database, ImportSummary } from '@/types/database'
import type { ParsedSingle } from '@/lib/utils/evernote-parser'

async function getAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function requireAdmin() {
  const cookieStore = await cookies()
  const caller = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cs) { try { cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch { /* */ } },
      },
    }
  )
  const { data: { user } } = await caller.auth.getUser()
  if (!user) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: row } = await caller.from('users' as any).select('role').eq('id', user.id).maybeSingle() as { data: { role: string } | null }
  if (row?.role !== 'platform_admin') return null
  return user
}

const MERGE_FIELDS: Record<string, string> = {
  phone: 'Phone', dob: 'Date of birth', age: 'Age', birth_month: 'Birth month',
  city: 'City', state: 'State', address: 'Address', height_inches: 'Height',
  current_yeshiva_seminary: 'Yeshiva / Seminary', eretz_yisroel: 'Eretz Yisroel',
  plans: 'Plans', looking_for: 'Looking for', family_background: 'Family background',
  siblings: 'Siblings', about_bio: 'Bio', photo_url: 'Photo',
}

interface ExistingRecord {
  id: string
  first_name: string
  last_name: string
  gender: string | null
  city: string | null
  state: string | null
  age: number | null
  dob: string | null
  phone: string | null
  birth_month: string | null
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

function secondaryMatch(r: ParsedSingle, ex: ExistingRecord): boolean {
  if (r.age !== null && ex.age !== null && Math.abs(r.age - ex.age) <= 1) return true
  if (r.dob && ex.dob && r.dob === ex.dob) return true
  if (r.phone && ex.phone) {
    const p1 = r.phone.replace(/\D/g, ''), p2 = ex.phone.replace(/\D/g, '')
    if (p1.length >= 10 && p1 === p2) return true
  }
  return false
}

function buildFamilyBg(r: ParsedSingle): string | null {
  return [
    r.father_name ? `Father: ${r.father_name}${r.father_occupation ? ` (${r.father_occupation})` : ''}` : null,
    r.mother_name ? `Mother: ${r.mother_name}${r.mother_occupation ? ` (${r.mother_occupation})` : ''}` : null,
    r.parents_location ? `Parents' location: ${r.parents_location}` : null,
    r.rebbi ? `Rebbi: ${r.rebbi}` : null,
  ].filter(Boolean).join('\n') || null
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAdmin()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    const supabase = await getAdminClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: batch, error: batchErr } = await (supabase.from('import_batches') as any)
      .select('id, shadchan_id, status, parsed_data')
      .eq('id', id)
      .maybeSingle() as {
        data: { id: string; shadchan_id: string; status: string; parsed_data: ParsedSingle[] } | null
        error: unknown
      }

    if (batchErr) throw batchErr
    if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
    if (batch.status === 'admin_approved') {
      return NextResponse.json({ error: 'Already approved' }, { status: 409 })
    }

    const records = (batch.parsed_data as ParsedSingle[]).filter(
      (r) => !r._skip && !r._parse_error && r.first_name && r.last_name && r.gender
    )

    const summary: ImportSummary = {
      completed_at: new Date().toISOString(),
      new_records: [],
      duplicates_skipped: [],
      existing_updated: [],
    }

    for (const r of records) {
      const fullName = `${r.first_name} ${r.last_name}`
      const familyBg = buildFamilyBg(r)
      const aboutBio = r.raw_notes?.length > 0 ? r.raw_notes.join('\n') : null
      const siblingsText = r.sibling_position ?? null

      // Query DB for name matches
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: nameMatches } = await (supabase.from('singles') as any)
        .select('id, first_name, last_name, gender, city, state, age, dob, phone, birth_month, address, height_inches, current_yeshiva_seminary, eretz_yisroel, plans, looking_for, family_background, siblings, about_bio, photo_url')
        .ilike('first_name', r.first_name)
        .ilike('last_name', r.last_name) as { data: ExistingRecord[] | null }

      const matches = nameMatches ?? []
      const confirmed = matches.find(ex => secondaryMatch(r, ex))
      const nameOnlyMatch = !confirmed && matches.length > 0 ? matches[0] : null

      if (nameOnlyMatch) {
        summary.duplicates_skipped.push({
          name: fullName,
          reason: 'Name match only (could not confirm identity)',
          existing_single_id: nameOnlyMatch.id,
          existing_single_name: `${nameOnlyMatch.first_name} ${nameOnlyMatch.last_name}`,
        })
        continue
      }

      if (confirmed) {
        // Fill blank fields only
        const incomingValues: Record<string, unknown> = {
          phone: r.phone ?? null, dob: r.dob ?? null, age: r.age ?? null,
          birth_month: r.birth_month ?? null, city: r.city ?? null, state: r.state ?? null,
          address: r.address ?? null, height_inches: r.height_inches ?? null,
          current_yeshiva_seminary: r.current_yeshiva_seminary ?? null,
          eretz_yisroel: r.eretz_yisroel ?? null, plans: r.plans ?? null,
          looking_for: r.looking_for ?? null, family_background: familyBg,
          siblings: siblingsText, about_bio: aboutBio, photo_url: r.photo_url ?? null,
        }

        const updates: Record<string, unknown> = {}
        const fieldsAdded: string[] = []
        const fieldsSkipped: string[] = []

        for (const [field, label] of Object.entries(MERGE_FIELDS)) {
          const incoming = incomingValues[field]
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
          await (supabase.from('singles') as any)
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', confirmed.id)
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('shadchan_singles') as any)
          .upsert({ shadchan_id: batch.shadchan_id, single_id: confirmed.id }, { onConflict: 'shadchan_id,single_id' })

        summary.existing_updated.push({
          name: fullName,
          single_id: confirmed.id,
          fields_added: fieldsAdded,
          fields_skipped: fieldsSkipped,
        })
        continue
      }

      // No match — insert new single
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: newSingle, error: insertErr } = await (supabase.from('singles') as any)
        .insert({
          created_by_shadchan_id: batch.shadchan_id,
          first_name: r.first_name, last_name: r.last_name, gender: r.gender,
          phone: r.phone ?? null, age: r.age ?? null, birth_month: r.birth_month ?? null,
          dob: r.dob ?? null, city: r.city ?? null, state: r.state ?? null,
          address: r.address ?? null, height_inches: r.height_inches ?? null,
          current_yeshiva_seminary: r.current_yeshiva_seminary ?? null,
          eretz_yisroel: r.eretz_yisroel ?? null, plans: r.plans ?? null,
          looking_for: r.looking_for ?? null, family_background: familyBg,
          siblings: siblingsText ? JSON.stringify(siblingsText) : null,
          about_bio: aboutBio, photo_url: r.photo_url ?? null, status: 'available',
        })
        .select('id')
        .single() as { data: { id: string } | null; error: unknown }

      if (insertErr || !newSingle) continue

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('shadchan_singles') as any)
        .insert({ shadchan_id: batch.shadchan_id, single_id: newSingle.id })

      summary.new_records.push({
        name: fullName,
        gender: r.gender,
        city: r.city ?? null,
        state: r.state ?? null,
        single_id: newSingle.id,
      })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('import_batches') as any)
      .update({
        status: 'admin_approved',
        import_summary: summary,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    return NextResponse.json({
      new_records: summary.new_records.length,
      duplicates_skipped: summary.duplicates_skipped.length,
      existing_updated: summary.existing_updated.length,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
