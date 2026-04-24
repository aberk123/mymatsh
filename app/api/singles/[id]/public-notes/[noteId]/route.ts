import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { type Database } from '@/types/database'

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; noteId: string } }
) {
  const { noteId } = params
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
  const { data: callerRow } = await (callerClient.from('users') as any)
    .select('role')
    .eq('id', user.id)
    .maybeSingle() as { data: { role: string } | null }

  const isAdmin = callerRow?.role === 'platform_admin'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: callerProfile } = await (callerClient.from('shadchan_profiles') as any)
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle() as { data: { id: string } | null }

  if (!callerProfile && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Fetch the note to verify ownership
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: note } = await (admin.from('single_public_notes') as any)
    .select('shadchan_id')
    .eq('id', noteId)
    .maybeSingle() as { data: { shadchan_id: string } | null }

  if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 })

  if (!isAdmin && note.shadchan_id !== callerProfile?.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin.from('single_public_notes') as any)
    .delete()
    .eq('id', noteId)

  if (error) return NextResponse.json({ error: (error as { message: string }).message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
