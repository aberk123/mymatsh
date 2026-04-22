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
  { label: 'Dashboard', href: '/portal/single', icon: LayoutDashboard },
  { label: 'My Profile', href: '/portal/single/profile', icon: UserCircle },
  { label: 'Suggestions', href: '/portal/single/matches', icon: Heart },
  { label: 'Messages', href: '/portal/single/messages', icon: MessageSquare },
]

interface MatchRow {
  id: string
  status: string
  message: string | null
  created_at: string
}

const statusMessages: Record<string, string> = {
  pending: 'A suggestion has been made for you. Your Shadchan will be in touch.',
  current: 'This suggestion is being discussed.',
  going_out: 'Awaiting more details from your Shadchan.',
  on_hold: 'Awaiting more details from your Shadchan.',
  past: 'This suggestion is no longer active.',
  engaged: 'Mazal Tov! This suggestion led to an engagement.',
  married: 'Mazal Tov! This suggestion led to a marriage.',
}

const statusBgClasses: Record<string, string> = {
  pending: 'bg-yellow-50 border-yellow-100',
  current: 'bg-blue-50 border-blue-100',
  going_out: 'bg-green-50 border-green-100',
  on_hold: 'bg-gray-50 border-gray-100',
}

export default function SingleMatchesPage() {
  const [loading, setLoading] = useState(true)
  const [matches, setMatches] = useState<MatchRow[]>([])

  useEffect(() => {
    const supabase = createClient()
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: single } = await (supabase.from('singles') as any)
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle() as { data: { id: string } | null }

      if (!single) { setLoading(false); return }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: rows } = await (supabase.from('matches') as any)
        .select('id, status, message, created_at')
        .or(`boy_id.eq.${single.id},girl_id.eq.${single.id}`)
        .order('created_at', { ascending: false }) as { data: MatchRow[] | null }

      setMatches(rows ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <AppLayout navItems={navItems} title="My Suggestions" role="single">
        <div className="flex items-center justify-center py-24 text-[#888888] text-sm">Loading…</div>
      </AppLayout>
    )
  }

  return (
    <AppLayout navItems={navItems} title="My Suggestions" role="single">
      <div className="mb-6">
        <p className="text-sm text-[#555555]">
          Your Shadchan carefully reviews each suggestion before sharing details. Identities are kept
          private until the appropriate time.
        </p>
      </div>

      {matches.length === 0 ? (
        <EmptyState message="No suggestions yet. Your Shadchan will be in touch soon." />
      ) : (
        <div className="space-y-4">
          {matches.map((match, idx) => (
            <div
              key={match.id}
              className={`card border ${statusBgClasses[match.status] ?? 'bg-[#FAFAFA] border-gray-100'}`}
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
                    <StatusBadge status={match.status} />
                  </div>

                  <p className="text-sm text-[#555555] mt-1.5">
                    {statusMessages[match.status] ?? 'A suggestion is pending.'}
                  </p>

                  {match.message && (
                    <div className="mt-2 p-2.5 rounded-lg bg-white border border-gray-100 flex items-start gap-2">
                      <MessageCircle className="h-4 w-4 text-brand-maroon mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-[#555555] italic">&ldquo;{match.message}&rdquo;</p>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 mt-2 text-xs text-[#888888]">
                    <Clock className="h-3 w-3" />
                    <span>
                      {new Date(match.created_at).toLocaleDateString('en-US', {
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
