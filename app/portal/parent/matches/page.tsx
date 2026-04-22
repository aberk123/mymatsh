'use client'

import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  UserCircle,
  Heart,
  MessageSquare,
  Clock,
  MessageCircle,
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { StatusBadge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import type { NavItem } from '@/components/ui/sidebar'
import { createClient } from '@/lib/supabase/client'

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/portal/parent', icon: LayoutDashboard },
  { label: 'My Child', href: '/portal/parent/child', icon: UserCircle },
  { label: 'Suggestions', href: '/portal/parent/matches', icon: Heart },
  { label: 'Messages', href: '/portal/parent/messages', icon: MessageSquare },
]

interface MatchRow {
  id: string
  status: string
  message: string | null
  created_at: string
  shadchanName: string
}

const statusMessages: Record<string, string> = {
  pending: 'A suggestion has been submitted for your child. Your Shadchan will be in touch.',
  current: 'This suggestion is currently being discussed.',
  going_out: 'Your child is moving forward with this suggestion.',
  on_hold: 'This suggestion is currently on hold.',
  past: 'This suggestion is no longer active.',
  engaged: 'Mazal Tov! This suggestion led to an engagement.',
  married: 'Mazal Tov! This suggestion led to a marriage.',
}

const statusBg: Record<string, string> = {
  pending: 'border-yellow-100',
  current: 'border-blue-100',
  going_out: 'border-green-100',
  on_hold: 'border-gray-100',
}

export default function ParentMatchesPage() {
  const [loading, setLoading] = useState(true)
  const [matches, setMatches] = useState<MatchRow[]>([])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: parent } = await (supabase.from('parents') as any)
        .select('child_id')
        .eq('user_id', user.id)
        .maybeSingle() as { data: { child_id: string } | null }

      if (!parent) { setLoading(false); return }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: rows } = await (supabase.from('matches') as any)
        .select('id, status, message, created_at, shadchan_id')
        .or(`boy_id.eq.${parent.child_id},girl_id.eq.${parent.child_id}`)
        .order('created_at', { ascending: false }) as {
          data: Array<{ id: string; status: string; message: string | null; created_at: string; shadchan_id: string }> | null
        }

      if (!rows || rows.length === 0) { setLoading(false); return }

      const shadchanIds = Array.from(new Set(rows.map((r) => r.shadchan_id)))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profiles } = await (supabase.from('shadchan_profiles') as any)
        .select('id, full_name')
        .in('id', shadchanIds) as { data: Array<{ id: string; full_name: string }> | null }

      const nameMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name]))

      setMatches(rows.map((r) => ({
        id: r.id,
        status: r.status,
        message: r.message,
        created_at: r.created_at,
        shadchanName: nameMap[r.shadchan_id] ?? '—',
      })))

      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <AppLayout navItems={navItems} title="Suggestions" role="parent">
        <div className="flex items-center justify-center py-24 text-[#888888] text-sm">Loading…</div>
      </AppLayout>
    )
  }

  return (
    <AppLayout navItems={navItems} title="Suggestions" role="parent">
      <div className="mb-6">
        <p className="text-sm text-[#555555]">
          You can view the status of each suggestion for your child. Identities of the other party
          remain private until your Shadchan decides it is appropriate to share.
        </p>
      </div>

      {matches.length === 0 ? (
        <EmptyState message="No suggestions yet. Your Shadchan will be in touch soon." />
      ) : (
        <div className="space-y-4">
          {matches.map((s, idx) => (
            <div
              key={s.id}
              className={`card border ${statusBg[s.status] ?? 'border-gray-100'}`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#F8F0F5] flex items-center justify-center text-sm font-bold text-brand-maroon border-2 border-white shadow">
                  #{idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-[#1A1A1A] text-sm">
                      Suggestion #{idx + 1}
                    </p>
                    <StatusBadge status={s.status} />
                  </div>
                  <p className="text-sm text-[#555555] mt-1.5">
                    {statusMessages[s.status] ?? 'Status update pending.'}
                  </p>

                  {s.message && (
                    <div className="mt-2 p-2.5 rounded-lg bg-white border border-gray-100 flex items-start gap-2">
                      <MessageCircle className="h-4 w-4 text-brand-maroon mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-[#555555] italic">&ldquo;{s.message}&rdquo;</p>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 mt-2 text-xs text-[#888888]">
                    <Clock className="h-3 w-3" />
                    <span>
                      Via {s.shadchanName} ·{' '}
                      {new Date(s.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  )
}
