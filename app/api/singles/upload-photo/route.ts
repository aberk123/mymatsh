import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const MAX_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const BUCKET = 'profile-photos'

async function getAuthUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// POST — upload a new photo
export async function POST(request: Request) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('photo') as File | null
  if (!file) return NextResponse.json({ error: 'No photo file provided' }, { status: 400 })

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'Invalid file type. Only JPG, PNG and WebP are allowed.' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large. Maximum size is 5 MB.' }, { status: 400 })
  }

  const admin = serviceClient()

  // Ownership: find the single record that belongs to this user
  const { data: single } = await admin
    .from('singles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!single) {
    return NextResponse.json({ error: 'Profile not found for this user' }, { status: 404 })
  }

  // Always store as JPEG (the client sends a canvas crop which is always JPEG)
  const storagePath = `${user.id}/photo1.jpg`
  const arrayBuffer = await file.arrayBuffer()

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(storagePath, arrayBuffer, {
      contentType: 'image/jpeg',
      upsert: true,
    })

  if (uploadError) {
    if (process.env.NODE_ENV === 'development') console.error('[upload-photo]', uploadError)
    return NextResponse.json({ error: 'Storage upload failed: ' + uploadError.message }, { status: 500 })
  }

  const { data: { publicUrl } } = admin.storage.from(BUCKET).getPublicUrl(storagePath)

  // Append a version param so CDN cache is busted on the client, but store clean URL in DB
  const { error: updateError } = await admin
    .from('singles')
    .update({ photo_url: publicUrl })
    .eq('id', single.id)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update profile: ' + updateError.message }, { status: 500 })
  }

  return NextResponse.json({ photoUrl: publicUrl })
}

// DELETE — remove the photo
export async function DELETE() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = serviceClient()

  const { data: single } = await admin
    .from('singles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!single) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  // Remove from storage (best-effort)
  await admin.storage.from(BUCKET).remove([`${user.id}/photo1.jpg`])

  // Clear photo_url
  await admin.from('singles').update({ photo_url: null }).eq('id', single.id)

  return NextResponse.json({ ok: true })
}
