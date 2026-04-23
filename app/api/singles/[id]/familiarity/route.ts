import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { type Database } from '@/types/database'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: singleId } = await params
  const cookieStore = await cookies()
  const callerClient = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cs) {
          try { cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) }
          catch { /* ignore */ }
        },
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
  const { data: profile } = await (admin.from('shadchan_profiles') as any)
    .select('id').eq('user_id', user.id).maybeSingle() as { data: { id: string } | null }
  if (!profile) return NextResponse.json({ error: 'Shadchan profile not found' }, { status: 404 })

  const body = await req.json() as { is_familiar: boolean }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin.from('shadchan_singles') as any)
    .update({ is_familiar: Boolean(body.is_familiar) })
    .eq('shadchan_id', profile.id)
    .eq('single_id', singleId)

  if (error) return NextResponse.json({ error: (error as { message: string }).message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
