'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard,
  Users,
  Heart,
  CalendarCheck,
  MessageSquare,
  UsersRound,
  UserCircle,
  Plus,
  Eye,
  LayoutGrid,
  LayoutList,
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { NavItem } from '@/components/ui/sidebar'
import type { MatchStatus } from '@/types/database'
import { createClient } from '@/lib/supabase/client'

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'My Singles', href: '/dashboard/singles', icon: Users },
  { label: 'Suggestions', href: '/dashboard/matches', icon: Heart },
  { label: 'Calendar', href: '/dashboard/tasks', icon: CalendarCheck },
  { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
  { label: 'Groups', href: '/dashboard/groups', icon: UsersRound },
  { label: 'My Profile', href: '/dashboard/profile', icon: UserCircle },
]

interface Match {
  id: string
  boyName: string
  girlName: string
  status: MatchStatus
  createdAt: string
}

const ALL_STATUSES: MatchStatus[] = ['pending', 'current', 'going_out', 'on_hold', 'past', 'engaged', 'married']

const statusLabels: Record<MatchStatus, string> = {
  pending:    'Pending',
  current:    'Current',
  going_out:  'Going Out',
  on_hold:    'On Hold',
  past:       'Past',
  engaged:    'Engaged',
  married:    'Married',
}

type FilterTab = 'all' | MatchStatus

export default function MatchesPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [view, setView] = useState<'table' | 'kanban'>('table')
  const [loading, setLoading] = useState(true)
  const [matches, setMatches] = useState<Match[]>([])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (supabase.from('shadchan_profiles') as any)
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle() as { data: { id: string } | null }

      if (!profile) { setLoading(false); return }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: rows } = await (supabase.from('matches') as any)
        .select('id, status, boy_id, girl_id, created_at')
        .eq('shadchan_id', profile.id)
        .order('created_at', { ascending: false }) as {
          data: Array<{ id: string; status: MatchStatus; boy_id: string; girl_id: string; created_at: string }> | null
        }

      if (!rows || rows.length === 0) { setLoading(false); return }

      const singleIds = Array.from(new Set([
        ...rows.map((r) => r.boy_id),
        ...rows.map((r) => r.girl_id),
      ]))

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: singles } = await (supabase.from('singles') as any)
        .select('id, first_name, last_name')
        .in('id', singleIds) as { data: Array<{ id: string; first_name: string; last_name: string }> | null }

      const nameMap = Object.fromEntries(
        (singles ?? []).map((s) => [s.id, `${s.first_name} ${s.last_name}`.trim()])
      )

      setMatches(
        rows.map((r) => ({
          id: r.id,
          boyName: nameMap[r.boy_id] ?? '—',
          girlName: nameMap[r.girl_id] ?? '—',
          status: r.status,
          createdAt: new Date(r.created_at).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
          }),
        }))
      )
      setLoading(false)
    }
    load()
  }, [])

  const filtered = activeTab === 'all'
    ? matches
    : matches.filter((m) => m.status === activeTab)

  function countFor(status: MatchStatus) {
    return matches.filter((m) => m.status === status).length
  }

  return (
    <AppLayout navItems={navItems} title="Suggestions" role="shadchan">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#1A1A1A]">Suggestions</h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white rounded-lg border border-gray-200 p-0.5">
            <button
              onClick={() => setView('table')}
              className={`p-1.5 rounded transition-colors ${view === 'table' ? 'bg-brand-maroon text-white' : 'text-[#888888] hover:text-[#1A1A1A]'}`}
              title="Table view"
            >
              <LayoutList className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView('kanban')}
              className={`p-1.5 rounded transition-colors ${view === 'kanban' ? 'bg-brand-maroon text-white' : 'text-[#888888] hover:text-[#1A1A1A]'}`}
              title="Kanban view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
          <Link href="/dashboard/matches/new">
            <Button className="btn-primary gap-2">
              <Plus className="h-4 w-4" />
              New Suggestion
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-1 flex-wrap mb-6 bg-white rounded-xl border border-gray-200 p-1">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'all' ? 'bg-brand-maroon text-white' : 'text-[#555555] hover:bg-gray-100'
          }`}
        >
          All
          <span className="ms-1.5 text-xs opacity-75">{matches.length}</span>
        </button>
        {ALL_STATUSES.map((status) => (
          <button
            key={status}
            onClick={() => setActiveTab(status)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === status ? 'bg-brand-maroon text-white' : 'text-[#555555] hover:bg-gray-100'
            }`}
          >
            {statusLabels[status]}
            <span className="ms-1.5 text-xs opacity-75">{countFor(status)}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-[#888888] text-sm">Loading…</div>
      ) : view === 'table' ? (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="table-th">Couple</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Date Created</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="table-td text-center text-[#888888] py-10">
                      No suggestions found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((match) => (
                    <tr key={match.id} className="table-row">
                      <td className="table-td">
                        <div className="font-medium text-[#1A1A1A]">{match.boyName}</div>
                        <div className="text-xs text-[#888888] mt-0.5">+ {match.girlName}</div>
                      </td>
                      <td className="table-td"><StatusBadge status={match.status} /></td>
                      <td className="table-td text-[#555555]">{match.createdAt}</td>
                      <td className="table-td">
                        <Link href={`/dashboard/matches/${match.id}`}>
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="View">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {ALL_STATUSES.map((status) => {
            const cards = matches.filter((m) => m.status === status)
            return (
              <div key={status} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-3 py-2.5 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#555555] uppercase tracking-wide">
                    {statusLabels[status]}
                  </span>
                  <span className="text-xs bg-gray-100 text-[#555555] rounded-full px-2 py-0.5">
                    {cards.length}
                  </span>
                </div>
                <div className="p-2 space-y-2 min-h-[80px]">
                  {cards.length === 0 ? (
                    <p className="text-xs text-[#BBBBBB] text-center py-4">No suggestions</p>
                  ) : (
                    cards.map((match) => (
                      <Link key={match.id} href={`/dashboard/matches/${match.id}`}>
                        <div className="p-2.5 rounded-lg border border-gray-100 hover:border-brand-maroon/30 hover:bg-[#FBF5F9] transition-colors cursor-pointer">
                          <p className="text-sm font-medium text-[#1A1A1A] leading-tight">{match.boyName}</p>
                          <p className="text-xs text-brand-pink leading-tight mt-0.5">+ {match.girlName}</p>
                          <p className="text-xs text-[#AAAAAA] mt-1">{match.createdAt}</p>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </AppLayout>
  )
}
