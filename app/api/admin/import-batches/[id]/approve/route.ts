import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/database'
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

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAdmin()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    const supabase = await getAdminClient()

    // Get the batch
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

    const inserted: string[] = []
    const errors: { name: string; error: string }[] = []

    for (const r of records) {
      const familyBg = [
        r.father_name ? `Father: ${r.father_name}${r.father_occupation ? ` (${r.father_occupation})` : ''}` : null,
        r.mother_name ? `Mother: ${r.mother_name}${r.mother_occupation ? ` (${r.mother_occupation})` : ''}` : null,
        r.parents_location ? `Parents' location: ${r.parents_location}` : null,
        r.rebbi ? `Rebbi: ${r.rebbi}` : null,
      ].filter(Boolean).join('\n') || null

      const siblingsText = r.sibling_position ?? null

      // Combine raw_notes into about_bio if no other bio
      const aboutBio = r.raw_notes && r.raw_notes.length > 0 ? r.raw_notes.join('\n') : null

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertErr } = await (supabase.from('singles') as any).insert({
        created_by_shadchan_id: batch.shadchan_id,
        first_name: r.first_name,
        last_name: r.last_name,
        gender: r.gender,
        phone: r.phone ?? null,
        age: r.age ?? null,
        birth_month: r.birth_month ?? null,
        dob: r.dob ?? null,
        city: r.city ?? null,
        state: r.state ?? null,
        address: r.address ?? null,
        height_inches: r.height_inches ?? null,
        current_yeshiva_seminary: r.current_yeshiva_seminary ?? null,
        eretz_yisroel: r.eretz_yisroel ?? null,
        plans: r.plans ?? null,
        looking_for: r.looking_for ?? null,
        family_background: familyBg,
        siblings: siblingsText ? JSON.stringify(siblingsText) : null,
        about_bio: aboutBio,
        photo_url: r.photo_url ?? null,
        status: 'available',
      })

      if (insertErr) {
        errors.push({ name: `${r.first_name} ${r.last_name}`, error: insertErr.message })
      } else {
        inserted.push(`${r.first_name} ${r.last_name}`)
      }
    }

    // Mark batch approved
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('import_batches') as any)
      .update({ status: 'admin_approved', updated_at: new Date().toISOString() })
      .eq('id', id)

    return NextResponse.json({ inserted: inserted.length, errors })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
