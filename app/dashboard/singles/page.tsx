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
  Search,
  UserPlus,
  CheckCircle,
  Clock,
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/ui/pagination'
import type { NavItem } from '@/components/ui/sidebar'
import type { RepresentationStatus } from '@/types/database'
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

interface MySingleRow {
  id: string
  first_name: string
  last_name: string
  gender: string
  age: number | null
  city: string | null
  state: string | null
  status: string
  hashkafa: string | null
  plans: string | null
  height_inches: number | null
  created_at: string
  labels: string[]
}

interface AllSingleRow {
  id: string
  first_name: string
  last_name: string
  gender: string
  age: number | null
  city: string | null
  state: string | null
  hashkafa: string | null
  plans: string | null
  height_inches: number | null
  shadchan_name: string
  myLabels: string[]
  repStatus: RepresentationStatus | null
}

const HASHKAFA_OPTIONS = [
  { value: '', label: 'All Hashkafa' },
  { value: 'yeshivish', label: 'Yeshivish' },
  { value: 'modern_orthodox', label: 'Modern Orthodox' },
  { value: 'chassidish', label: 'Chassidish' },
  { value: 'sephardic', label: 'Sephardic' },
  { value: 'baal_teshuva', label: 'Baal Teshuva' },
  { value: 'other', label: 'Other' },
]

// 5'0" (60 in) through 6'6" (78 in)
const HEIGHT_OPTIONS = [
  { value: 0, label: 'Any' },
  ...Array.from({ length: 19 }, (_, i) => {
    const inches = 60 + i
    return { value: inches, label: `${Math.floor(inches / 12)}'${inches % 12}"` }
  }),
]

type ActiveTab = 'mine' | 'all'

export default function SinglesPage() {
  const [profileId, setProfileId] = useState('')
  const [activeTab, setActiveTab] = useState<ActiveTab>('mine')

  // My Singles
  const [myLoading, setMyLoading] = useState(true)
  const [mySingles, setMySingles] = useState<MySingleRow[]>([])
  const [myLabelsList, setMyLabelsList] = useState<string[]>([])

  // All Singles
  const [allLoading, setAllLoading] = useState(false)
  const [allLoaded, setAllLoaded] = useState(false)
  const [allSingles, setAllSingles] = useState<AllSingleRow[]>([])

  // Shared filters
  const [search, setSearch] = useState('')
  const [genderFilter, setGenderFilter] = useState<'All' | 'male' | 'female'>('All')
  const [statusFilter, setStatusFilter] = useState('all')
  const [labelFilter, setLabelFilter] = useState('all')
  const [hashkafaFilter, setHashkafaFilter] = useState('')
  const [ageMin, setAgeMin] = useState('')
  const [ageMax, setAgeMax] = useState('')
  const [heightMin, setHeightMin] = useState(0)
  const [heightMax, setHeightMax] = useState(0)
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 10

  useEffect(() => {
    async function loadMySingles() {
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

      // Get my linked single IDs from junction table
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: junctionData } = await (supabase.from('shadchan_singles') as any)
        .select('single_id')
        .eq('shadchan_id', profile.id) as { data: Array<{ single_id: string }> | null }

      const myIds = (junctionData ?? []).map((j: { single_id: string }) => j.single_id)

      type SingleDataRow = {
        id: string; first_name: string; last_name: string; gender: string
        age: number | null; city: string | null; state: string | null; status: string
        hashkafa: string | null; plans: string | null; height_inches: number | null; created_at: string
      }

      let singlesData: SingleDataRow[] | null = null
      if (myIds.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res = await (supabase.from('singles') as any)
          .select('id, first_name, last_name, gender, age, city, state, status, hashkafa, plans, height_inches, created_at')
          .in('id', myIds)
          .order('created_at', { ascending: false }) as { data: SingleDataRow[] | null }
        singlesData = res.data
      }

      const rows = singlesData ?? []

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: labelsData } = await (supabase.from('labels') as any)
        .select('id, name')
        .eq('shadchan_id', profile.id) as { data: Array<{ id: string; name: string }> | null }

      const labelById: Record<string, string> = {}
      for (const l of labelsData ?? []) labelById[l.id] = l.name

      const labelsBySingle: Record<string, string[]> = {}
      if (rows.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: slData } = await (supabase.from('single_labels') as any)
          .select('single_id, label_id')
          .in('single_id', rows.map(s => s.id)) as { data: Array<{ single_id: string; label_id: string }> | null }

        for (const sl of slData ?? []) {
          if (!labelsBySingle[sl.single_id]) labelsBySingle[sl.single_id] = []
          const name = labelById[sl.label_id]
          if (name) labelsBySingle[sl.single_id].push(name)
        }
      }

      setMySingles(rows.map(s => ({ ...s, labels: labelsBySingle[s.id] ?? [] })))
      setMyLabelsList(Object.values(labelById).sort())
      setMyLoading(false)
    }
    loadMySingles()
  }, [])

  const loadAllSingles = useCallback(async () => {
    if (allLoaded || !profileId) return
    setAllLoading(true)
    const supabase = createClient()

    // All available singles not created by this shadchan
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: singlesData } = await (supabase.from('singles') as any)
      .select('id, first_name, last_name, gender, age, city, state, hashkafa, plans, height_inches, created_by_shadchan_id')
      .eq('status', 'available')
      .neq('created_by_shadchan_id', profileId)
      .order('first_name', { ascending: true })
      .limit(1000) as {
        data: Array<{
          id: string; first_name: string; last_name: string; gender: string
          age: number | null; city: string | null; state: string | null
          hashkafa: string | null; plans: string | null; height_inches: number | null
          created_by_shadchan_id: string
        }> | null
      }

    const rows = singlesData ?? []

    // Resolve shadchan names
    const shadchanIds = Array.from(new Set(rows.map(r => r.created_by_shadchan_id)))
    const shadchanMap: Record<string, string> = {}
    if (shadchanIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profs } = await (supabase.from('shadchan_profiles') as any)
        .select('id, full_name')
        .in('id', shadchanIds) as { data: Array<{ id: string; full_name: string }> | null }
      for (const p of profs ?? []) shadchanMap[p.id] = p.full_name
    }

    // This shadchan's representation requests
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: repData } = await (supabase.from('representation_requests') as any)
      .select('single_id, status')
      .eq('shadchan_id', profileId) as { data: Array<{ single_id: string; status: RepresentationStatus }> | null }
    const repMap: Record<string, RepresentationStatus> = {}
    for (const r of repData ?? []) repMap[r.single_id] = r.status

    // This shadchan's labels applied to the all-singles list (RLS-safe: labels.shadchan_id = profile.id)
    const myLabelsBySingle: Record<string, string[]> = {}
    if (rows.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: labelsData } = await (supabase.from('labels') as any)
        .select('id, name')
        .eq('shadchan_id', profileId) as { data: Array<{ id: string; name: string }> | null }

      const myLabelById: Record<string, string> = {}
      for (const l of labelsData ?? []) myLabelById[l.id] = l.name

      if (Object.keys(myLabelById).length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: slData } = await (supabase.from('single_labels') as any)
          .select('single_id, label_id')
          .in('single_id', rows.map(r => r.id))
          .in('label_id', Object.keys(myLabelById)) as { data: Array<{ single_id: string; label_id: string }> | null }

        for (const sl of slData ?? []) {
          if (!myLabelsBySingle[sl.single_id]) myLabelsBySingle[sl.single_id] = []
          const name = myLabelById[sl.label_id]
          if (name) myLabelsBySingle[sl.single_id].push(name)
        }
      }
    }

    setAllSingles(rows.map(r => ({
      id: r.id,
      first_name: r.first_name,
      last_name: r.last_name,
      gender: r.gender,
      age: r.age,
      city: r.city,
      state: r.state,
      hashkafa: r.hashkafa,
      plans: r.plans,
      height_inches: r.height_inches,
      shadchan_name: shadchanMap[r.created_by_shadchan_id] ?? '—',
      myLabels: myLabelsBySingle[r.id] ?? [],
      repStatus: repMap[r.id] ?? null,
    })))
    setAllLoaded(true)
    setAllLoading(false)
  }, [profileId, allLoaded])

  useEffect(() => {
    if (activeTab === 'all' && !allLoaded && profileId) {
      loadAllSingles()
    }
  }, [activeTab, allLoaded, profileId, loadAllSingles])

  type FilterableRow = {
    first_name: string; last_name: string; gender: string
    age: number | null; city: string | null; state: string | null
    hashkafa: string | null; plans: string | null; height_inches: number | null
  }

  function applyFilters<T extends FilterableRow>(items: T[], getLabels: (item: T) => string[]): T[] {
    return items.filter(s => {
      const loc = [s.city, s.state].filter(Boolean).join(', ').toLowerCase()
      const q = search.toLowerCase()
      if (q && !`${s.first_name} ${s.last_name}`.toLowerCase().includes(q) &&
          !loc.includes(q) && !(s.plans ?? '').toLowerCase().includes(q)) return false
      if (genderFilter !== 'All' && s.gender !== genderFilter) return false
      if (hashkafaFilter && s.hashkafa !== hashkafaFilter) return false
      const ageMinN = ageMin ? parseInt(ageMin, 10) : null
      const ageMaxN = ageMax ? parseInt(ageMax, 10) : null
      if (ageMinN !== null && (s.age === null || s.age < ageMinN)) return false
      if (ageMaxN !== null && (s.age === null || s.age > ageMaxN)) return false
      if (heightMin > 0 && (s.height_inches === null || s.height_inches < heightMin)) return false
      if (heightMax > 0 && (s.height_inches === null || s.height_inches > heightMax)) return false
      if (labelFilter !== 'all' && !getLabels(s).includes(labelFilter)) return false
      return true
    })
  }

  const filteredMine = applyFilters(
    statusFilter === 'all' ? mySingles : mySingles.filter(s => s.status === statusFilter),
    s => s.labels
  )
  const filteredAll = applyFilters(allSingles, s => s.myLabels)

  const current: (MySingleRow | AllSingleRow)[] = activeTab === 'mine' ? filteredMine : filteredAll
  const paginated = current.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const loading = activeTab === 'mine' ? myLoading : allLoading

  async function handleRepresent(singleId: string) {
    const res = await fetch('/api/representation-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ single_id: singleId }),
    })
    if (res.ok || res.status === 409) {
      setAllSingles(prev => prev.map(s => s.id === singleId ? { ...s, repStatus: 'pending' } : s))
    }
  }

  function switchTab(tab: ActiveTab) {
    setActiveTab(tab)
    setPage(1)
  }

  return (
    <AppLayout navItems={navItems} title="Singles" role="shadchan">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h1 className="text-xl font-semibold text-[#1A1A1A]">Singles</h1>
        <Link href="/dashboard/singles/new">
          <Button variant="primary" size="md" className="gap-2">
            <Plus className="h-4 w-4" />
            Add New Single
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-5">
        {(['mine', 'all'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => switchTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-brand-maroon text-brand-maroon'
                : 'border-transparent text-[#888888] hover:text-[#555555]'
            }`}
          >
            {tab === 'mine' ? 'My Singles' : 'All Singles'}
            <span className="ml-2 bg-gray-100 text-gray-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
              {tab === 'mine' ? mySingles.length : allLoaded ? allSingles.length : '…'}
            </span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="card mb-5 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#888888]" />
            <input
              className="input-base ps-9 w-full"
              placeholder="Search by name, city, or plans…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['All', 'male', 'female'] as const).map(g => (
              <button
                key={g}
                onClick={() => { setGenderFilter(g); setPage(1) }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                  genderFilter === g
                    ? 'bg-brand-maroon text-white border-brand-maroon'
                    : 'border-gray-300 text-[#555555] hover:bg-gray-50'
                }`}
              >
                {g === 'All' ? 'All' : g === 'male' ? 'Male' : 'Female'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          {activeTab === 'mine' && (
            <select className="input-base w-auto min-w-[140px]" value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}>
              <option value="all">All Statuses</option>
              <option value="available">Available</option>
              <option value="draft">Draft</option>
              <option value="on_hold">On Hold</option>
              <option value="engaged">Engaged</option>
              <option value="inactive">Inactive</option>
            </select>
          )}

          <select className="input-base w-auto min-w-[150px]" value={hashkafaFilter}
            onChange={(e) => { setHashkafaFilter(e.target.value); setPage(1) }}>
            {HASHKAFA_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <select className="input-base w-auto min-w-[130px]" value={labelFilter}
            onChange={(e) => { setLabelFilter(e.target.value); setPage(1) }}>
            <option value="all">All Labels</option>
            {myLabelsList.map(label => (
              <option key={label} value={label}>{label}</option>
            ))}
          </select>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#888888] whitespace-nowrap">Age</span>
            <input type="number" placeholder="Min" className="input-base w-16 text-center"
              value={ageMin} min={16} max={99}
              onChange={(e) => { setAgeMin(e.target.value); setPage(1) }} />
            <span className="text-xs text-[#888888]">–</span>
            <input type="number" placeholder="Max" className="input-base w-16 text-center"
              value={ageMax} min={16} max={99}
              onChange={(e) => { setAgeMax(e.target.value); setPage(1) }} />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#888888] whitespace-nowrap">Height</span>
            <select className="input-base w-auto" value={heightMin}
              onChange={(e) => { setHeightMin(parseInt(e.target.value, 10)); setPage(1) }}>
              {HEIGHT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.value === 0 ? 'Min' : o.label}</option>
              ))}
            </select>
            <span className="text-xs text-[#888888]">–</span>
            <select className="input-base w-auto" value={heightMax}
              onChange={(e) => { setHeightMax(parseInt(e.target.value, 10)); setPage(1) }}>
              {HEIGHT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.value === 0 ? 'Max' : o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-[#888888] text-sm">Loading…</div>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-xs text-[#888888]">
                Showing <span className="font-medium text-[#555555]">{current.length}</span> of{' '}
                <span className="font-medium text-[#555555]">
                  {activeTab === 'mine' ? mySingles.length : allSingles.length}
                </span> singles
              </p>
            </div>
            <div className="overflow-x-auto">
              {activeTab === 'mine' ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="table-th w-8">#</th>
                      <th className="table-th">Name</th>
                      <th className="table-th">Gender</th>
                      <th className="table-th">Age</th>
                      <th className="table-th">City</th>
                      <th className="table-th">Hashkafa</th>
                      <th className="table-th">Status</th>
                      <th className="table-th">Your Labels</th>
                      <th className="table-th">Date Added</th>
                      <th className="table-th">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(paginated as MySingleRow[]).map((s, idx) => (
                      <tr key={s.id} className="table-row">
                        <td className="table-td text-[#888888]">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                        <td className="table-td font-medium text-[#1A1A1A]">
                          <Link href={`/dashboard/singles/${s.id}`} className="hover:text-brand-maroon transition-colors">
                            {s.first_name} {s.last_name}
                          </Link>
                        </td>
                        <td className="table-td text-[#555555]">{s.gender === 'male' ? 'Male' : 'Female'}</td>
                        <td className="table-td text-[#555555]">{s.age ?? '—'}</td>
                        <td className="table-td text-[#555555]">
                          {[s.city, s.state].filter(Boolean).join(', ') || '—'}
                        </td>
                        <td className="table-td text-[#555555] capitalize">
                          {(s.hashkafa ?? '—').replace('_', ' ')}
                        </td>
                        <td className="table-td"><StatusBadge status={s.status} /></td>
                        <td className="table-td">
                          <div className="flex flex-wrap gap-1">
                            {s.labels.map(label => (
                              <span key={label} className="text-xs bg-[#F8F0F5] text-brand-maroon px-2 py-0.5 rounded-full font-medium">
                                {label}
                              </span>
                            ))}
                            {s.labels.length === 0 && <span className="text-[#BBBBBB] text-xs">—</span>}
                          </div>
                        </td>
                        <td className="table-td text-[#555555] whitespace-nowrap">
                          {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="table-td">
                          <Link href={`/dashboard/singles/${s.id}`}>
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="View">
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {paginated.length === 0 && (
                      <tr>
                        <td colSpan={10} className="text-center py-12 text-[#888888] text-sm">
                          {mySingles.length === 0 ? 'No singles added yet.' : 'No singles match your filters.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="table-th w-8">#</th>
                      <th className="table-th">Name</th>
                      <th className="table-th">Gender</th>
                      <th className="table-th">Age</th>
                      <th className="table-th">City</th>
                      <th className="table-th">Hashkafa</th>
                      <th className="table-th">Shadchan</th>
                      <th className="table-th">Your Labels</th>
                      <th className="table-th">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(paginated as AllSingleRow[]).map((s, idx) => (
                      <tr key={s.id} className="table-row">
                        <td className="table-td text-[#888888]">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                        <td className="table-td font-medium text-[#1A1A1A]">
                          <Link href={`/dashboard/singles/${s.id}`} className="hover:text-brand-maroon transition-colors">
                            {s.first_name} {s.last_name}
                          </Link>
                        </td>
                        <td className="table-td text-[#555555]">{s.gender === 'male' ? 'Male' : 'Female'}</td>
                        <td className="table-td text-[#555555]">{s.age ?? '—'}</td>
                        <td className="table-td text-[#555555]">
                          {[s.city, s.state].filter(Boolean).join(', ') || '—'}
                        </td>
                        <td className="table-td text-[#555555] capitalize">
                          {(s.hashkafa ?? '—').replace('_', ' ')}
                        </td>
                        <td className="table-td text-[#555555] text-xs">{s.shadchan_name}</td>
                        <td className="table-td">
                          <div className="flex flex-wrap gap-1">
                            {s.myLabels.map(label => (
                              <span key={label} className="text-xs bg-[#F8F0F5] text-brand-maroon px-2 py-0.5 rounded-full font-medium">
                                {label}
                              </span>
                            ))}
                            {s.myLabels.length === 0 && <span className="text-[#BBBBBB] text-xs">—</span>}
                          </div>
                        </td>
                        <td className="table-td">
                          <div className="flex items-center gap-1.5">
                            <Link href={`/dashboard/singles/${s.id}`}>
                              <Button variant="ghost" size="icon" className="h-7 w-7" title="View">
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                            {s.repStatus === 'pending' && (
                              <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                <Clock className="h-3 w-3" />Pending
                              </span>
                            )}
                            {s.repStatus === 'accepted' && (
                              <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />Representing
                              </span>
                            )}
                            {s.repStatus === 'declined' && (
                              <span className="text-xs text-[#888888] bg-gray-100 px-2 py-0.5 rounded-full">
                                Declined
                              </span>
                            )}
                            {s.repStatus === null && (
                              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs"
                                onClick={() => handleRepresent(s.id)}>
                                <UserPlus className="h-3 w-3" />
                                Represent
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {paginated.length === 0 && (
                      <tr>
                        <td colSpan={9} className="text-center py-12 text-[#888888] text-sm">
                          No singles match your filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
            {current.length > PAGE_SIZE && (
              <Pagination
                total={current.length}
                page={page}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}
