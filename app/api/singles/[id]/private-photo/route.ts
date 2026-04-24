import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { type Database } from '@/types/database'

async function getCallerProfile(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  const callerClient = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )
  const { data: { user } } = await callerClient.auth.getUser()
  if (!user) return { user: null, profile: null, callerClient }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (callerClient.from('shadchan_profiles') as any)
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle() as { data: { id: string } | null }

  return { user, profile, callerClient }
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { id: singleId } = params
  const cookieStore = await cookies()
  const { user, profile } = await getCallerProfile(cookieStore)

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!profile) return NextResponse.json({ error: 'Not a shadchan' }, { status: 403 })

  const admin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Check DB for recorded storage paths
  const [{ data: ssRow }, { data: notesRow }] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin.from('shadchan_singles') as any)
      .select('private_photo_url')
      .eq('shadchan_id', profile.id)
      .eq('single_id', singleId)
      .maybeSingle() as Promise<{ data: { private_photo_url: string | null } | null }>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin.from('shadchan_private_notes') as any)
      .select('image_url')
      .eq('shadchan_id', profile.id)
      .eq('single_id', singleId)
      .maybeSingle() as Promise<{ data: { image_url: string | null } | null }>,
  ])

  const photoPath = ssRow?.private_photo_url ?? null
  const notePath = notesRow?.image_url ?? null

  const [photoResult, noteResult] = await Promise.all([
    photoPath
      ? admin.storage.from('private-photos').createSignedUrl(photoPath, 3600)
      : Promise.resolve({ data: null, error: null }),
    notePath
      ? admin.storage.from('private-photos').createSignedUrl(notePath, 3600)
      : Promise.resolve({ data: null, error: null }),
  ])

  return NextResponse.json({
    photoUrl: photoResult.data?.signedUrl ?? null,
    noteImageUrl: noteResult.data?.signedUrl ?? null,
  })
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { id: singleId } = params
  const cookieStore = await cookies()
  const { user, profile } = await getCallerProfile(cookieStore)

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!profile) return NextResponse.json({ error: 'Not a shadchan' }, { status: 403 })

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  const type = (formData.get('type') as string | null) ?? 'photo'

  if (!file || file.size === 0) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'File too large (max 5 MB)' }, { status: 400 })

  const admin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const filename = type === 'note' ? `note.${ext}` : `photo.${ext}`
  const storagePath = `${profile.id}/${singleId}/${filename}`

  const arrayBuffer = await file.arrayBuffer()

  const { error: uploadError } = await admin.storage
    .from('private-photos')
    .upload(storagePath, arrayBuffer, {
      contentType: file.type || 'image/jpeg',
      upsert: true,
    })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  // Update DB reference
  if (type === 'note') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin.from('shadchan_private_notes') as any).upsert(
      {
        shadchan_id: profile.id,
        single_id: singleId,
        note_text: '',
        image_url: storagePath,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'shadchan_id,single_id' }
    )
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin.from('shadchan_singles') as any)
      .update({ private_photo_url: storagePath })
      .eq('shadchan_id', profile.id)
      .eq('single_id', singleId)
  }

  const { data: signedData } = await admin.storage
    .from('private-photos')
    .createSignedUrl(storagePath, 3600)

  return NextResponse.json({ ok: true, signedUrl: signedData?.signedUrl ?? null })
}
