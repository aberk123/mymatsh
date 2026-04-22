'use client'

import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  Users,
  MessageSquare,
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { StatusBadge } from '@/components/ui/badge'
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
  activeSuggestions: number
}

export default function AdvocateSinglesPage() {
  const [loading, setLoading] = useState(true)
  const [singles, setSingles] = useState<SingleRow[]>([])

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: advocate } = await (supabase.from('advocates') as any)
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle() as { data: { id: string } | null }

      if (!advocate) { setLoading(false); return }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: requests } = await (supabase.from('advocate_requests') as any)
        .select('single_id')
        .eq('advocate_id', advocate.id)
        .eq('status', 'active') as { data: Array<{ single_id: string }> | null }

      const singleIds = (requests ?? []).map((r) => r.single_id)

      if (singleIds.length === 0) { setLoading(false); return }

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

      if (!singlesData || singlesData.length === 0) { setLoading(false); return }

      const shadchanIds = Array.from(new Set(singlesData.map((s) => s.created_by_shadchan_id)))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profiles } = await (supabase.from('shadchan_profiles') as any)
        .select('id, full_name')
        .in('id', shadchanIds) as { data: Array<{ id: string; full_name: string }> | null }

      const nameMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name]))

      // Count active matches for each single
      const rows: SingleRow[] = []
      for (const s of singlesData) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { count } = await (supabase.from('matches') as any)
          .select('id', { count: 'exact', head: true })
          .in('status', ['pending', 'current', 'going_out'])
          .or(`boy_id.eq.${s.id},girl_id.eq.${s.id}`) as { count: number | null }

        rows.push({
          id: s.id,
          name: `${s.first_name} ${s.last_name}`.trim(),
          age: s.age,
          city: [s.city, s.state].filter(Boolean).join(', ') || '',
          status: s.status,
          shadchanName: nameMap[s.created_by_shadchan_id] ?? '—',
          activeSuggestions: count ?? 0,
        })
      }

      setSingles(rows)
      setLoading(false)
    }

    load()
  }, [])

  if (loading) {
    return (
      <AppLayout navItems={navItems} title="My Singles" role="advocate">
        <div className="flex items-center justify-center py-24 text-[#888888] text-sm">Loading…</div>
      </AppLayout>
    )
  }

  return (
    <AppLayout navItems={navItems} title="My Singles" role="advocate">
      <div className="mb-6">
        <p className="text-sm text-[#555555]">
          View and monitor the singles you advocate for. Contact their Shadchan for any updates or
          concerns.
        </p>
      </div>

      {singles.length === 0 ? (
        <EmptyState message="You are not currently advocating for any singles." />
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="table-th">Single</th>
                  <th className="table-th">Age</th>
                  <th className="table-th">City</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Shadchan</th>
                  <th className="table-th text-center">Active Suggestions</th>
                </tr>
              </thead>
              <tbody>
                {singles.map((single) => (
                  <tr key={single.id} className="table-row">
                    <td className="table-td">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={single.name} size="sm" />
                        <span className="font-medium text-[#1A1A1A]">{single.name}</span>
                      </div>
                    </td>
                    <td className="table-td text-[#555555]">{single.age ?? '—'}</td>
                    <td className="table-td text-[#555555]">{single.city || '—'}</td>
                    <td className="table-td">
                      <StatusBadge status={single.status} />
                    </td>
                    <td className="table-td text-[#555555]">{single.shadchanName}</td>
                    <td className="table-td text-center">
                      {single.activeSuggestions > 0 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-maroon text-white text-xs font-bold">
                          {single.activeSuggestions}
                        </span>
                      ) : (
                        <span className="text-[#888888]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
