'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  ChevronRight,
  Heart,
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { WelcomeBanner } from '@/components/ui/welcome-banner'
import { StatCard } from '@/components/ui/stat-card'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { EmptyState } from '@/components/ui/empty-state'
import type { NavItem } from '@/components/ui/sidebar'
import { createClient } from '@/lib/supabase/client'

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/portal/advocate', icon: LayoutDashboard },
  { label: 'My Singles', href: '/portal/advocate/singles', icon: Users },
  { label: 'Messages', href: '/portal/advocate/messages', icon: MessageSquare },
]

interface SingleRow {
  id: string
  name: string
  age: number | null
  city: string
  status: string
  shadchanName: string
}

export default function AdvocateDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [advocateName, setAdvocateName] = useState('')
  const [singles, setSingles] = useState<SingleRow[]>([])
  const [activeMatchesCount, setActiveMatchesCount] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: advocate } = await (supabase.from('advocates') as any)
        .select('id, full_name')
        .eq('user_id', user.id)
        .maybeSingle() as { data: { id: string; full_name: string } | null }

      if (!advocate) { setLoading(false); return }
      setAdvocateName(advocate.full_name)

      // Load singles this advocate is linked to via advocate_requests
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: requests } = await (supabase.from('advocate_requests') as any)
        .select('single_id')
        .eq('advocate_id', advocate.id)
        .eq('status', 'active') as { data: Array<{ single_id: string }> | null }

      const singleIds = (requests ?? []).map((r) => r.single_id)

      if (singleIds.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: singlesData } = await (supabase.from('singles') as any)
          .select('id, first_name, last_name, age, city, state, status, created_by_shadchan_id')
          .in('id', singleIds) as {
            data: Array<{
              id: string
              first_name: string
              last_name: string
              age: number | null
              city: string | null
              state: string | null
              status: string
              created_by_shadchan_id: string
            }> | null
          }

        if (singlesData && singlesData.length > 0) {
          const shadchanIds = Array.from(new Set(singlesData.map((s) => s.created_by_shadchan_id)))
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: profiles } = await (supabase.from('shadchan_profiles') as any)
            .select('id, full_name')
            .in('id', shadchanIds) as { data: Array<{ id: string; full_name: string }> | null }

          const nameMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name]))

          setSingles(singlesData.map((s) => ({
            id: s.id,
            name: `${s.first_name} ${s.last_name}`.trim(),
            age: s.age,
            city: [s.city, s.state].filter(Boolean).join(', ') || '',
            status: s.status,
            shadchanName: nameMap[s.created_by_shadchan_id] ?? '—',
          })))

          // Count active matches for these singles
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { count: matchCount } = await (supabase.from('matches') as any)
            .select('id', { count: 'exact', head: true })
            .in('status', ['pending', 'current', 'going_out'])
            .or(singleIds.map((id: string) => `boy_id.eq.${id},girl_id.eq.${id}`).join(',')) as { count: number | null }

          setActiveMatchesCount(matchCount ?? 0)
        }
      }

      // Unread messages
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count: unread } = await (supabase.from('messages') as any)
        .select('id', { count: 'exact', head: true })
        .eq('to_user_id', user.id)
        .eq('is_read', false) as { count: number | null }

      setUnreadCount(unread ?? 0)
      setLoading(false)
    }

    load()
  }, [])

  if (loading) {
    return (
      <AppLayout navItems={navItems} title="Advocate Dashboard" role="advocate">
        <div className="flex items-center justify-center py-24 text-[#888888] text-sm">Loading…</div>
      </AppLayout>
    )
  }

  if (!advocateName) {
    return (
      <AppLayout navItems={navItems} title="Advocate Dashboard" role="advocate">
        <EmptyState message="Advocate profile not found. Please contact support." />
      </AppLayout>
    )
  }

  return (
    <AppLayout navItems={navItems} title="Advocate Dashboard" role="advocate">
      <WelcomeBanner
        greeting={`Welcome, ${advocateName}`}
        subtitle="Advocate for the singles in your care."
        steps={[
          { number: 1, label: 'Review Singles' },
          { number: 2, label: 'Track Progress' },
          { number: 3, label: 'Stay Connected' },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <StatCard label="Singles I Advocate For" value={singles.length} icon={Users} />
        <StatCard label="Active Suggestions" value={activeMatchesCount} icon={Heart} />
        <StatCard label="Unread Messages" value={unreadCount} icon={MessageSquare} />
      </div>

      <div className="card mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#1A1A1A]">Singles I Advocate For</h3>
          <Link href="/portal/advocate/singles">
            <Button variant="ghost" size="sm" className="text-brand-maroon gap-1">
              View All <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {singles.length === 0 ? (
          <p className="text-sm text-[#888888] text-center py-4">
            You are not currently advocating for any singles.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {singles.slice(0, 4).map((single) => (
              <div key={single.id} className="p-3 rounded-lg bg-[#FAFAFA] border border-gray-100 flex items-start gap-3">
                <Avatar name={single.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-sm font-semibold text-[#1A1A1A] truncate">{single.name}</p>
                    <StatusBadge status={single.status} />
                  </div>
                  <p className="text-xs text-[#888888] mt-0.5">
                    {single.age ? `Age ${single.age}` : ''}
                    {single.age && single.city ? ' · ' : ''}
                    {single.city}
                  </p>
                  <p className="text-xs text-[#555555] mt-0.5">Shadchan: {single.shadchanName}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
