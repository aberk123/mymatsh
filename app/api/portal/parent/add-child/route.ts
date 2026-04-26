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
  if ((callerRow as { role: string } | null)?.role !== 'parent') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const adminClient = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: parentProfile } = await (adminClient.from('parents') as any)
    .select('id, child_id')
    .eq('user_id', user.id)
    .maybeSingle() as { data: { id: string; child_id: string | null } | null }

  if (!parentProfile) return NextResponse.json({ error: 'Parent profile not found' }, { status: 404 })
  if (parentProfile.child_id) return NextResponse.json({ error: 'Child profile already exists' }, { status: 409 })

  const contentType = request.headers.get('content-type') ?? ''

  let firstName = '', lastName = '', gender = '', dob = '', city = '', state = '', yeshivaSeminary = ''
  let photoFile: File | null = null
  let resumeFile: File | null = null

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData()
    firstName = String(formData.get('first_name') ?? '').trim()
    lastName = String(formData.get('last_name') ?? '').trim()
    gender = String(formData.get('gender') ?? '').trim()
    dob = String(formData.get('dob') ?? '').trim()
    city = String(formData.get('city') ?? '').trim()
    state = String(formData.get('state') ?? '').trim()
    yeshivaSeminary = String(formData.get('current_yeshiva_seminary') ?? '').trim()
    const photoEntry = formData.get('photo')
    const resumeEntry = formData.get('resume')
    if (photoEntry instanceof File && photoEntry.size > 0) photoFile = photoEntry
    if (resumeEntry instanceof File && resumeEntry.size > 0) resumeFile = resumeEntry
  } else {
    const body = await request.json() as Record<string, unknown>
    firstName = String(body.first_name ?? '').trim()
    lastName = String(body.last_name ?? '').trim()
    gender = String(body.gender ?? '').trim()
    dob = String(body.dob ?? '').trim()
    city = String(body.city ?? '').trim()
    state = String(body.state ?? '').trim()
    yeshivaSeminary = String(body.current_yeshiva_seminary ?? '').trim()
  }

  if (!firstName || !lastName) return NextResponse.json({ error: 'First and last name are required' }, { status: 400 })
  if (gender !== 'male' && gender !== 'female') return NextResponse.json({ error: 'Gender is required' }, { status: 400 })

  const singleRecord: Record<string, unknown> = {
    first_name: firstName,
    last_name: lastName,
    gender,
    created_by_shadchan_id: null,
    source: 'parent_submitted',
    status: 'draft',
    parent_id: parentProfile.id,
  }
  if (dob) singleRecord.dob = dob
  if (city) singleRecord.city = city
  if (state) singleRecord.state = state
  if (yeshivaSeminary) singleRecord.current_yeshiva_seminary = yeshivaSeminary

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: newSingle, error: insertError } = await (adminClient.from('singles') as any)
    .insert(singleRecord)
    .select('id')
    .single() as { data: { id: string } | null; error: unknown }

  if (insertError || !newSingle) {
    return NextResponse.json({ error: (insertError as { message: string } | null)?.message ?? 'Failed to create single' }, { status: 500 })
  }

  // Upload photo if provided
  if (photoFile) {
    const photoExt = photoFile.name.split('.').pop() ?? 'jpg'
    const photoPath = `singles/${newSingle.id}/profile.${photoExt}`
    const photoBytes = await photoFile.arrayBuffer()
    const { data: photoData } = await adminClient.storage
      .from('profile-photos')
      .upload(photoPath, photoBytes, { contentType: photoFile.type, upsert: true })
    if (photoData) {
      const { data: { publicUrl } } = adminClient.storage.from('profile-photos').getPublicUrl(photoPath)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (adminClient.from('singles') as any).update({ photo_url: publicUrl }).eq('id', newSingle.id)
    }
  }

  // Upload resume if provided
  if (resumeFile) {
    const resumeExt = resumeFile.name.split('.').pop() ?? 'pdf'
    const resumePath = `singles/${newSingle.id}/resume.${resumeExt}`
    const resumeBytes = await resumeFile.arrayBuffer()
    const { data: resumeData } = await adminClient.storage
      .from('resumes')
      .upload(resumePath, resumeBytes, { contentType: resumeFile.type, upsert: true })
    if (resumeData) {
      const { data: { publicUrl } } = adminClient.storage.from('resumes').getPublicUrl(resumePath)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (adminClient.from('singles') as any).update({ resume_url: publicUrl }).eq('id', newSingle.id)
    }
  }

  // Link single to parent record
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (adminClient.from('parents') as any)
    .update({ child_id: newSingle.id, updated_at: new Date().toISOString() })
    .eq('id', parentProfile.id)

  return NextResponse.json({ id: newSingle.id })
}
