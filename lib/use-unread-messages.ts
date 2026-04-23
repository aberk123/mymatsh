import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useUnreadMessageCount(): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count: n } = await (supabase.from('messages') as any)
        .select('*', { count: 'exact', head: true })
        .eq('to_user_id', user.id)
        .eq('is_read', false)
      setCount(n ?? 0)
    })
  }, [])

  return count
}
