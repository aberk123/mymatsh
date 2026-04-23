import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { type Database } from '@/types/database'

const MAX_BYTES = 5 * 1024 * 1024
const MAX_PHOTOS = 5
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const BUCKET = 'profile-photos'

async function getCtx(singleId: string) {
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
  if (!user) return { error: 'Unauthorized', status: 401 } as const

  const admin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: userRow } = await (admin.from('users') as any)
    .select('role').eq('id', user.id).maybeSingle() as { data: { role: string } | null }
  const role = userRow?.role ?? ''

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: single } = await (admin.from('singles') as any)
    .select('id, user_id').eq('id', singleId).maybeSingle() as
    { data: { id: string; user_id: string | null } | null }
  if (!single) return { error: 'Single not found', status: 404 } as const

  if (role !== 'single' || single.user_id !== user.id) {
    return { error: 'Forbidden', status: 403 } as const
  }

  return { user, single, admin }
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
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
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin.from('single_photos') as any)
    .select('id, public_url, position, caption')
    .eq('single_id', id)
    .order('position', { ascending: true }) as { data: Record<string, unknown>[] | null }

  return NextResponse.json({ photos: data ?? [] })
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getCtx(id)
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count } = await (ctx.admin.from('single_photos') as any)
    .select('id', { count: 'exact', head: true }).eq('single_id', id) as { count: number | null }
  if ((count ?? 0) >= MAX_PHOTOS) {
    return NextResponse.json({ error: `Maximum ${MAX_PHOTOS} photos allowed` }, { status: 400 })
  }

  let formData: FormData
  try { formData = await req.formData() }
  catch { return NextResponse.json({ error: 'Invalid form data' }, { status: 400 }) }

  const file = formData.get('photo') as File | null
  if (!file) return NextResponse.json({ error: 'No photo file provided' }, { status: 400 })
  if (!ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'File too large (max 5 MB)' }, { status: 400 })

  const position = count ?? 0
  const storagePath = `${ctx.user.id}/photo${position + 1}_${Date.now()}.jpg`
  const arrayBuffer = await file.arrayBuffer()

  const { error: uploadError } = await ctx.admin.storage
    .from(BUCKET)
    .upload(storagePath, arrayBuffer, { contentType: 'image/jpeg', upsert: false })

  if (uploadError) return NextResponse.json({ error: 'Storage upload failed: ' + uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = ctx.admin.storage.from(BUCKET).getPublicUrl(storagePath)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: newPhoto, error: insertError } = await (ctx.admin.from('single_photos') as any)
    .insert({ single_id: id, storage_path: storagePath, public_url: publicUrl, position })
    .select().single() as { data: Record<string, unknown> | null; error: unknown }

  if (insertError) return NextResponse.json({ error: (insertError as { message: string }).message }, { status: 500 })

  // If first photo, also set singles.photo_url
  if (position === 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (ctx.admin.from('singles') as any).update({ photo_url: publicUrl }).eq('id', id)
  }

  return NextResponse.json({ photo: newPhoto })
}
