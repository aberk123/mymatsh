import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/database'

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
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch { /* ignore */ }
        },
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

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAdmin()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    const body = await request.json() as {
      title?: string
      body?: string
      release_date?: string
      image_url?: string
    }

    const supabase = await getAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: article, error } = await (supabase.from('news') as any)
      .update({
        ...(body.title !== undefined ? { title: body.title.trim() } : {}),
        ...(body.body !== undefined ? { body: body.body } : {}),
        ...(body.release_date !== undefined ? { release_date: body.release_date } : {}),
        ...(body.image_url !== undefined ? { image_url: body.image_url.trim() || null } : {}),
      })
      .eq('id', id)
      .select()
      .single() as {
        data: { id: string; title: string; body: string; image_url: string | null; release_date: string; created_at: string } | null
        error: unknown
      }

    if (error) throw error
    return NextResponse.json(article)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAdmin()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    const supabase = await getAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('news') as any).delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
