'use client'

import { useCallback, useEffect, useState } from 'react'
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
  ArrowRight,
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

interface MyMatch {
  id: string
  boyName: string
  girlName: string
  status: MatchStatus
  createdAt: string
}

interface AllMatch {
  id: string
  boyName: string
  girlName: string
  status: MatchStatus
  shadchanName: string
  createdAt: string
  // which side is this shadchan's single
  mySide: 'boy' | 'girl' | 'both'
}

const ALL_STATUSES: MatchStatus[] = ['pending', 'current', 'going_out', 'on_hold', 'past', 'engaged', 'married']

const statusLabels: Record<MatchStatus, string> = {
  pending:   'Pending',
  current:   'Current',
  going_out: 'Going Out',
  on_hold:   'On Hold',
  past:      'Past',
  engaged:   'Engaged',
  married:   'Married',
}

type OuterTab = 'mine' | 'all'
type StatusFilter = 'all' | MatchStatus

export default function MatchesPage() {
  const [profileId, setProfileId] = useState('')
  const [outerTab, setOuterTab] = useState<OuterTab>('mine')

  // My Suggestions
  const [myLoading, setMyLoading] = useState(true)
  const [myMatches, setMyMatches] = useState<MyMatch[]>([])
  const [myStatusFilter, setMyStatusFilter] = useState<StatusFilter>('all')
  const [view, setView] = useState<'table' | 'kanban'>('table')

  // All Suggestions
  const [allLoading, setAllLoading] = useState(false)
  const [allLoaded, setAllLoaded] = useState(false)
  const [allMatches, setAllMatches] = useState<AllMatch[]>([])
  const [allStatusFilter, setAllStatusFilter] = useState<StatusFilter>('all')

  useEffect(() => {
    async function loadMyMatches() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setMyLoading(false); return }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (supabase.from('shadchan_profiles') as any)
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle() as { data: { id: string } | null }

      if (!profile) { setMyLoading(false); return }
      setProfileId(profile.id)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: rows } = await (supabase.from('matches') as any)
        .select('id, status, boy_id, girl_id, created_at')
        .eq('shadchan_id', profile.id)
        .order('created_at', { ascending: false }) as {
          data: Array<{ id: string; status: MatchStatus; boy_id: string; girl_id: string; created_at: string }> | null
        }

      if (!rows || rows.length === 0) { setMyLoading(false); return }

      const singleIds = Array.from(new Set([...rows.map(r => r.boy_id), ...rows.map(r => r.girl_id)]))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: singles } = await (supabase.from('singles') as any)
        .select('id, first_name, last_name')
        .in('id', singleIds) as { data: Array<{ id: string; first_name: string; last_name: string }> | null }

      const nameMap = Object.fromEntries(
        (singles ?? []).map(s => [s.id, `${s.first_name} ${s.last_name}`.trim()])
      )

      setMyMatches(rows.map(r => ({
        id: r.id,
        boyName: nameMap[r.boy_id] ?? '—',
        girlName: nameMap[r.girl_id] ?? '—',
        status: r.status,
        createdAt: new Date(r.created_at).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric',
        }),
      })))
      setMyLoading(false)
    }
    loadMyMatches()
  }, [])

  const loadAllMatches = useCallback(async () => {
    if (allLoaded || !profileId) return
    setAllLoading(true)
    const supabase = createClient()

    // Get this shadchan's singles
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: mySinglesData } = await (supabase.from('singles') as any)
      .select('id')
      .eq('created_by_shadchan_id', profileId) as { data: Array<{ id: string }> | null }

    const mySingleIds = (mySinglesData ?? []).map(s => s.id)

    if (mySingleIds.length === 0) {
      setAllLoaded(true)
      setAllLoading(false)
      return
    }

    // Two queries: matches where boy is mine, and matches where girl is mine
    // (Supabase client SDK can't OR across columns in a single query)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: boyRows } = await (supabase.from('matches') as any)
      .select('id, status, boy_id, girl_id, shadchan_id, created_at')
      .in('boy_id', mySingleIds)
      .neq('shadchan_id', profileId)
      .order('created_at', { ascending: false }) as {
        data: Array<{ id: string; status: MatchStatus; boy_id: string; girl_id: string; shadchan_id: string; created_at: string }> | null
      }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: girlRows } = await (supabase.from('matches') as any)
      .select('id, status, boy_id, girl_id, shadchan_id, created_at')
      .in('girl_id', mySingleIds)
      .neq('shadchan_id', profileId)
      .order('created_at', { ascending: false }) as {
        data: Array<{ id: string; status: MatchStatus; boy_id: string; girl_id: string; shadchan_id: string; created_at: string }> | null
      }

    // Merge + deduplicate, tracking which side is mine
    const mySingleSet = new Set(mySingleIds)
    const seen = new Set<string>()
    type RawRow = { id: string; status: MatchStatus; boy_id: string; girl_id: string; shadchan_id: string; created_at: string; mySide: 'boy' | 'girl' | 'both' }
    const merged: RawRow[] = []

    for (const r of boyRows ?? []) {
      if (!seen.has(r.id)) {
        seen.add(r.id)
        const isMyGirl = mySingleSet.has(r.girl_id)
        merged.push({ ...r, mySide: isMyGirl ? 'both' : 'boy' })
      }
    }
    for (const r of girlRows ?? []) {
      if (!seen.has(r.id)) {
        seen.add(r.id)
        merged.push({ ...r, mySide: 'girl' })
      } else {
        // Already added as 'boy' — upgrade to 'both' if girl is also mine
        const existing = merged.find(m => m.id === r.id)
        if (existing) existing.mySide = 'both'
      }
    }

    // Resolve names
    const allSingleIds = Array.from(new Set([...merged.map(r => r.boy_id), ...merged.map(r => r.girl_id)]))
    const allShadchanIds = Array.from(new Set(merged.map(r => r.shadchan_id)))

    const nameMap: Record<string, string> = {}
    const shadchanMap: Record<string, string> = {}

    if (allSingleIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: singles } = await (supabase.from('singles') as any)
        .select('id, first_name, last_name')
        .in('id', allSingleIds) as { data: Array<{ id: string; first_name: string; last_name: string }> | null }
      for (const s of singles ?? []) nameMap[s.id] = `${s.first_name} ${s.last_name}`.trim()
    }

    if (allShadchanIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profs } = await (supabase.from('shadchan_profiles') as any)
        .select('id, full_name')
        .in('id', allShadchanIds) as { data: Array<{ id: string; full_name: string }> | null }
      for (const p of profs ?? []) shadchanMap[p.id] = p.full_name
    }

    setAllMatches(merged.map(r => ({
      id: r.id,
      boyName: nameMap[r.boy_id] ?? '—',
      girlName: nameMap[r.girl_id] ?? '—',
      status: r.status,
      shadchanName: shadchanMap[r.shadchan_id] ?? '—',
      createdAt: new Date(r.created_at).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      }),
      mySide: r.mySide,
    })))
    setAllLoaded(true)
    setAllLoading(false)
  }, [profileId, allLoaded])

  useEffect(() => {
    if (outerTab === 'all' && !allLoaded && profileId) {
      loadAllMatches()
    }
  }, [outerTab, allLoaded, profileId, loadAllMatches])

  const filteredMine = myStatusFilter === 'all'
    ? myMatches
    : myMatches.filter(m => m.status === myStatusFilter)

  const filteredAll = allStatusFilter === 'all'
    ? allMatches
    : allMatches.filter(m => m.status === allStatusFilter)

  return (
    <AppLayout navItems={navItems} title="Suggestions" role="shadchan">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#1A1A1A]">Suggestions</h2>
        <div className="flex items-center gap-3">
          {outerTab === 'mine' && (
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
          )}
          <Link href="/dashboard/matches/new">
            <Button className="btn-primary gap-2">
              <Plus className="h-4 w-4" />
              New Suggestion
            </Button>
          </Link>
        </div>
      </div>

      {/* Outer tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-5">
        {(['mine', 'all'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setOuterTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              outerTab === tab
                ? 'border-brand-maroon text-brand-maroon'
                : 'border-transparent text-[#888888] hover:text-[#555555]'
            }`}
          >
            {tab === 'mine' ? 'My Suggestions' : 'All Suggestions'}
            <span className="ml-2 bg-gray-100 text-gray-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
              {tab === 'mine' ? myMatches.length : allLoaded ? allMatches.length : '…'}
            </span>
          </button>
        ))}
      </div>

      {/* ── My Suggestions ── */}
      {outerTab === 'mine' && (
        <>
          <div className="flex items-center gap-1 flex-wrap mb-6 bg-white rounded-xl border border-gray-200 p-1">
            <button
              onClick={() => setMyStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                myStatusFilter === 'all' ? 'bg-brand-maroon text-white' : 'text-[#555555] hover:bg-gray-100'
              }`}
            >
              All <span className="ms-1.5 text-xs opacity-75">{myMatches.length}</span>
            </button>
            {ALL_STATUSES.map(status => (
              <button
                key={status}
                onClick={() => setMyStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  myStatusFilter === status ? 'bg-brand-maroon text-white' : 'text-[#555555] hover:bg-gray-100'
                }`}
              >
                {statusLabels[status]}
                <span className="ms-1.5 text-xs opacity-75">
                  {myMatches.filter(m => m.status === status).length}
                </span>
              </button>
            ))}
          </div>

          {myLoading ? (
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
                    {filteredMine.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="table-td text-center text-[#888888] py-10">
                          No suggestions found.
                        </td>
                      </tr>
                    ) : (
                      filteredMine.map(match => (
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
              {ALL_STATUSES.map(status => {
                const cards = filteredMine.filter(m => m.status === status)
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
                        cards.map(match => (
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
        </>
      )}

      {/* ── All Suggestions ── */}
      {outerTab === 'all' && (
        <>
          <div className="mb-4 px-1 text-sm text-[#555555]">
            Suggestions made by other shadchanim that involve your singles.
          </div>

          <div className="flex items-center gap-1 flex-wrap mb-6 bg-white rounded-xl border border-gray-200 p-1">
            <button
              onClick={() => setAllStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                allStatusFilter === 'all' ? 'bg-brand-maroon text-white' : 'text-[#555555] hover:bg-gray-100'
              }`}
            >
              All <span className="ms-1.5 text-xs opacity-75">{allMatches.length}</span>
            </button>
            {ALL_STATUSES.map(status => (
              <button
                key={status}
                onClick={() => setAllStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  allStatusFilter === status ? 'bg-brand-maroon text-white' : 'text-[#555555] hover:bg-gray-100'
                }`}
              >
                {statusLabels[status]}
                <span className="ms-1.5 text-xs opacity-75">
                  {allMatches.filter(m => m.status === status).length}
                </span>
              </button>
            ))}
          </div>

          {allLoading ? (
            <div className="flex items-center justify-center py-24 text-[#888888] text-sm">Loading…</div>
          ) : (
            <div className="card overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="table-th">Couple</th>
                      <th className="table-th">Your Single</th>
                      <th className="table-th">Status</th>
                      <th className="table-th">Suggested By</th>
                      <th className="table-th">Date</th>
                      <th className="table-th">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAll.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="table-td text-center text-[#888888] py-10">
                          {allMatches.length === 0
                            ? 'No suggestions involving your singles yet.'
                            : 'No suggestions match this filter.'}
                        </td>
                      </tr>
                    ) : (
                      filteredAll.map(match => (
                        <tr key={match.id} className="table-row">
                          <td className="table-td">
                            <div className="font-medium text-[#1A1A1A]">{match.boyName}</div>
                            <div className="text-xs text-[#888888] mt-0.5 flex items-center gap-1">
                              <ArrowRight className="h-3 w-3 flex-shrink-0" />
                              {match.girlName}
                            </div>
                          </td>
                          <td className="table-td">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              match.mySide === 'both'
                                ? 'bg-purple-100 text-purple-700'
                                : match.mySide === 'boy'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-pink-100 text-pink-700'
                            }`}>
                              {match.mySide === 'both' ? 'Both' : match.mySide === 'boy' ? match.boyName : match.girlName}
                            </span>
                          </td>
                          <td className="table-td"><StatusBadge status={match.status} /></td>
                          <td className="table-td text-[#555555] text-xs">{match.shadchanName}</td>
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
          )}
        </>
      )}
    </AppLayout>
  )
}
