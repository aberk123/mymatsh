import { createClient } from '@supabase/supabase-js'

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function createNotification(
  userId: string,
  type: string,
  payload: Record<string, unknown> = {}
): Promise<void> {
  try {
    const supabase = serviceClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('notifications') as any).insert({ user_id: userId, type, payload })
  } catch (err) {
    // Never block the main request due to a notification failure
    console.error('[notifications] failed to create notification:', err)
  }
}

export async function notifyAllAdmins(
  type: string,
  payload: Record<string, unknown> = {}
): Promise<void> {
  try {
    const supabase = serviceClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: admins } = await (supabase.from('users') as any)
      .select('id')
      .eq('role', 'platform_admin') as { data: { id: string }[] | null }

    if (!admins?.length) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('notifications') as any).insert(
      admins.map(a => ({ user_id: a.id, type, payload }))
    )
  } catch (err) {
    console.error('[notifications] failed to notify admins:', err)
  }
}
