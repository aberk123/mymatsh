import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { type Database } from '@/types/database'

const VALID_STATUSES = ['draft', 'available', 'on_hold', 'engaged', 'married', 'inactive']

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const cookieStore = await cookies()
  const callerClient = createServerClient<Database>(
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

  const { data: { user } } = await callerClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: callerRow } = await callerClient.from('users').select('role').eq('id', user.id).maybeSingle()
  const role = (callerRow as { role: string } | null)?.role
  if (role !== 'shadchan') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { status } = await request.json() as { status: string }
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const adminClient = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profileRow } = await (adminClient.from('shadchan_profiles') as any)
    .select('id').eq('user_id', user.id).maybeSingle() as { data: { id: string } | null }
  if (!profileRow) return NextResponse.json({ error: 'Shadchan profile not found' }, { status: 404 })

  // Verify shadchan has access to this single (created it or has it in their list)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: single } = await (adminClient.from('singles') as any)
    .select('id, created_by_shadchan_id')
    .eq('id', params.id)
    .maybeSingle() as { data: { id: string; created_by_shadchan_id: string | null } | null }

  if (!single) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (single.created_by_shadchan_id !== profileRow.id) {
    // Check shadchan_singles junction
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: junction } = await (adminClient.from('shadchan_singles') as any)
      .select('single_id').eq('shadchan_id', profileRow.id).eq('single_id', params.id).maybeSingle() as { data: { single_id: string } | null }
    if (!junction) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (adminClient.from('singles') as any)
    .update({ status })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: (error as { message: string }).message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
