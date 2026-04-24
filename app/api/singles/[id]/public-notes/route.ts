import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { type Database } from '@/types/database'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { id: singleId } = params
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: callerProfile } = await (callerClient.from('shadchan_profiles') as any)
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle() as { data: { id: string } | null }

  if (!callerProfile) return NextResponse.json({ error: 'Not a shadchan' }, { status: 403 })

  const admin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rows } = await (admin.from('single_public_notes') as any)
    .select('id, note_text, shadchan_id, created_at')
    .eq('single_id', singleId)
    .order('created_at', { ascending: false }) as {
      data: Array<{ id: string; note_text: string; shadchan_id: string; created_at: string }> | null
    }

  if (!rows || rows.length === 0) return NextResponse.json({ notes: [] })

  const shadchanIds = Array.from(new Set(rows.map((r) => r.shadchan_id)))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profiles } = await (admin.from('shadchan_profiles') as any)
    .select('id, full_name')
    .in('id', shadchanIds) as { data: Array<{ id: string; full_name: string }> | null }

  const nameMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name]))

  return NextResponse.json({
    notes: rows.map((r) => ({
      id: r.id,
      note_text: r.note_text,
      shadchan_id: r.shadchan_id,
      shadchan_name: nameMap[r.shadchan_id] ?? 'Unknown Shadchan',
      created_at: r.created_at,
      is_own: r.shadchan_id === callerProfile.id,
    })),
  })
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { id: singleId } = params
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (callerClient.from('shadchan_profiles') as any)
    .select('id, full_name')
    .eq('user_id', user.id)
    .maybeSingle() as { data: { id: string; full_name: string } | null }

  if (!profile) return NextResponse.json({ error: 'Not a shadchan' }, { status: 403 })

  const body = await req.json()
  const noteText = (body.note_text ?? '').trim()
  if (!noteText) return NextResponse.json({ error: 'Note text is required' }, { status: 400 })

  const admin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: newNote, error } = await (admin.from('single_public_notes') as any)
    .insert({
      single_id: singleId,
      shadchan_id: profile.id,
      note_text: noteText,
    })
    .select('id, note_text, shadchan_id, created_at')
    .single() as { data: { id: string; note_text: string; shadchan_id: string; created_at: string } | null; error: unknown }

  if (error || !newNote) {
    return NextResponse.json({ error: 'Failed to save note' }, { status: 500 })
  }

  return NextResponse.json({
    note: {
      id: newNote.id,
      note_text: newNote.note_text,
      shadchan_id: newNote.shadchan_id,
      shadchan_name: profile.full_name,
      created_at: newNote.created_at,
      is_own: true,
    },
  })
}
