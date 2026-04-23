import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { type Database } from '@/types/database'

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
  const { data: single } = await (admin.from('singles') as any)
    .select('id, user_id').eq('id', singleId).maybeSingle() as
    { data: { id: string; user_id: string | null } | null }
  if (!single) return { error: 'Single not found', status: 404 } as const
  if (single.user_id !== user.id) return { error: 'Forbidden', status: 403 } as const

  return { user, single, admin }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; photoId: string }> }) {
  const { id, photoId } = await params
  const ctx = await getCtx(id)
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

  const body = await req.json() as { position?: number; caption?: string }
  const payload: Record<string, unknown> = {}
  if (typeof body.position === 'number') payload.position = body.position
  if ('caption' in body) payload.caption = body.caption

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (ctx.admin.from('single_photos') as any)
    .update(payload).eq('id', photoId).eq('single_id', id)

  if (error) return NextResponse.json({ error: (error as { message: string }).message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; photoId: string }> }) {
  const { id, photoId } = await params
  const ctx = await getCtx(id)
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: photo } = await (ctx.admin.from('single_photos') as any)
    .select('storage_path, position').eq('id', photoId).eq('single_id', id).maybeSingle() as
    { data: { storage_path: string; position: number } | null }
  if (!photo) return NextResponse.json({ error: 'Photo not found' }, { status: 404 })

  await ctx.admin.storage.from(BUCKET).remove([photo.storage_path])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (ctx.admin.from('single_photos') as any).delete().eq('id', photoId)

  // If deleted position=0, update singles.photo_url to next photo or null
  if (photo.position === 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: next } = await (ctx.admin.from('single_photos') as any)
      .select('public_url').eq('single_id', id).order('position', { ascending: true }).limit(1).maybeSingle() as
      { data: { public_url: string } | null }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (ctx.admin.from('singles') as any).update({ photo_url: next?.public_url ?? null }).eq('id', id)
  }

  return NextResponse.json({ ok: true })
}
