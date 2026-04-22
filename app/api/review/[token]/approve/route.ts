import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/database'

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    const body = await request.json() as { comments?: string }

    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Verify token exists and is in a reviewable state
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: batch, error: fetchErr } = await (supabase.from('import_batches') as any)
      .select('id, status')
      .eq('review_token', token)
      .maybeSingle() as { data: { id: string; status: string } | null; error: unknown }

    if (fetchErr) throw fetchErr
    if (!batch) return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
    if (batch.status === 'admin_approved' || batch.status === 'rejected') {
      return NextResponse.json({ error: 'Batch is already finalized' }, { status: 409 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateErr } = await (supabase.from('import_batches') as any)
      .update({
        status: 'shadchan_approved',
        shadchan_comments: body.comments?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', batch.id)

    if (updateErr) throw updateErr
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
