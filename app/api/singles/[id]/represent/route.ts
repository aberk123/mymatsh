import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { type Database } from '@/types/database'

export async function POST(_request: Request, { params }: { params: { id: string } }) {
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
  if ((callerRow as { role: string } | null)?.role !== 'shadchan') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const adminClient = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (adminClient.from('shadchan_profiles') as any)
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle() as { data: { id: string } | null }

  if (!profile) return NextResponse.json({ error: 'Shadchan profile not found' }, { status: 404 })

  // Only claim singles that are currently unrepresented
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: single } = await (adminClient.from('singles') as any)
    .select('id, created_by_shadchan_id')
    .eq('id', params.id)
    .maybeSingle() as { data: { id: string; created_by_shadchan_id: string | null } | null }

  if (!single) return NextResponse.json({ error: 'Single not found' }, { status: 404 })
  if (single.created_by_shadchan_id) {
    return NextResponse.json({ error: 'This single already has a shadchan' }, { status: 409 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (adminClient.from('singles') as any)
    .update({ created_by_shadchan_id: profile.id, updated_at: new Date().toISOString() })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: (error as { message: string }).message }, { status: 500 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (adminClient.from('shadchan_singles') as any)
    .upsert({ shadchan_id: profile.id, single_id: params.id }, { onConflict: 'shadchan_id,single_id' })

  return NextResponse.json({ success: true })
}
