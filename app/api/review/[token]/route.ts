import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/database'

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    if (!token) return NextResponse.json({ error: 'Invalid token' }, { status: 400 })

    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: batch, error } = await (supabase.from('import_batches') as any)
      .select('id, shadchan_id, status, parsed_data, shadchan_comments, created_at')
      .eq('review_token', token)
      .maybeSingle() as { data: Record<string, unknown> | null; error: unknown }

    if (error) throw error
    if (!batch) return NextResponse.json({ error: 'Invalid or expired review link' }, { status: 404 })

    if (batch.status === 'rejected') {
      return NextResponse.json({ error: 'This batch has been rejected' }, { status: 410 })
    }

    // Resolve shadchan name
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: sp } = await (supabase.from('shadchan_profiles') as any)
      .select('full_name')
      .eq('id', batch.shadchan_id)
      .maybeSingle() as { data: { full_name: string } | null }

    return NextResponse.json({ ...batch, shadchan_name: sp?.full_name ?? '—' })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
