import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export interface RateLimitResult {
  allowed: boolean
  retryAfterMs?: number
}

/**
 * Check and increment a per-user rate limit.
 * Uses a tumbling window — resets at the start of each window period.
 */
export async function checkRateLimit(
  userId: string,
  endpoint: string,
  maxRequests: number,
  windowMs: number
): Promise<RateLimitResult> {
  const supabase = serviceClient()
  const now = Date.now()
  // Align window start to a fixed grid (e.g. every hour on the hour)
  const windowStart = new Date(Math.floor(now / windowMs) * windowMs).toISOString()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase.from('api_rate_limits') as any)
    .select('request_count, window_start')
    .eq('user_id', userId)
    .eq('endpoint', endpoint)
    .maybeSingle() as { data: { request_count: number; window_start: string } | null }

  const existingWindowTime = existing ? new Date(existing.window_start).getTime() : 0
  const currentWindowTime = new Date(windowStart).getTime()
  const isCurrentWindow = existingWindowTime === currentWindowTime

  if (isCurrentWindow) {
    if (existing!.request_count >= maxRequests) {
      const windowEnd = currentWindowTime + windowMs
      return { allowed: false, retryAfterMs: windowEnd - now }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('api_rate_limits') as any)
      .update({ request_count: existing!.request_count + 1 })
      .eq('user_id', userId)
      .eq('endpoint', endpoint)
    return { allowed: true }
  }

  // New window — upsert resets the counter
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('api_rate_limits') as any).upsert(
    { user_id: userId, endpoint, request_count: 1, window_start: windowStart },
    { onConflict: 'user_id,endpoint' }
  )
  return { allowed: true }
}

function formatDuration(ms: number): string {
  const minutes = Math.ceil(ms / 60_000)
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'}`
  const hours = Math.ceil(ms / 3_600_000)
  return `${hours} hour${hours === 1 ? '' : 's'}`
}

export function rateLimitResponse(retryAfterMs: number) {
  return NextResponse.json(
    { error: `Rate limit exceeded. Please try again in ${formatDuration(retryAfterMs)}.` },
    { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } }
  )
}
