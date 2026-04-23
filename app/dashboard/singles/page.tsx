'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
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
import { useUnreadMessageCount } from '@/lib/use-unread-messages'

const HASHKAFA_OPTIONS = [
  { value: '', label: 'All Hashkafa' },
  { value: 'yeshivish', label: 'Yeshivish' },
  { value: 'modern_orthodox', label: 'Modern Orthodox' },
  { value: 'chassidish', label: 'Chassidish' },
  { value: 'sephardic', label: 'Sephardic' },
  { value: 'baal_teshuva', label: 'Baal Teshuva' },
  { value: 'other', label: 'Other' },
]

const HEIGHT_OPTIONS = [
  { value: 0, label: 'Any' },
  ...Array.from({ length: 19 }, (_, i) => {
    const inches = 60 + i
    return { value: inches, label: `${Math.floor(inches / 12)}'${inches % 12}"` }
  }),
]

interface ApiSingle {
  id: string
  first_name: string
  last_name: string
  gender: string
  age: number | null
  city: string | null
  state: string | null
  status: string | null
  hashkafa: string | null
  plans: string | null
  height_inches: number | null
  created_at: string
  shadchan_name: string
  labels: string[]
  rep_status: string | null
}

type ActiveTab = 'mine' | 'all'

const PAGE_SIZE = 20

export default function SinglesPage() {
  const unreadMessages = useUnreadMessageCount()

  const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'My Singles', href: '/dashboard/singles', icon: Users },
    { label: 'Suggestions', href: '/dashboard/matches', icon: Heart },
    { label: 'Calendar', href: '/dashboard/tasks', icon: CalendarCheck },
    { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare, badge: unreadMessages > 0 ? String(unreadMessages) : undefined },
    { label: 'Groups', href: '/dashboard/groups', icon: UsersRound },
    { label: 'My Profile', href: '/dashboard/profile', icon: UserCircle },
  ]

  const [activeTab, setActiveTab] = useState<ActiveTab>('mine')
  const [page, setPage] = useState(1)
  const [singles, setSingles] = useState<ApiSingle[]>([])
  const [total, setTotal] = useState(0)
  const [tabTotals, setTabTotals] = useState<{ mine: number | null; all: number | null }>({ mine: null, all: null })
  const [labelsList, setLabelsList] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  // Filters
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [genderFilter, setGenderFilter] = useState<'All' | 'male' | 'female'>('All')
  const [statusFilter, setStatusFilter] = useState('')
  const [hashkafaFilter, setHashkafaFilter] = useState('')
  const [labelFilter, setLabelFilter] = useState('')
  const [ageMin, setAgeMin] = useState('')
  const [ageMax, setAgeMax] = useState('')
  const [heightMin, setHeightMin] = useState(0)
  const [heightMax, setHeightMax] = useState(0)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Main data fetch
  const fetchRef = useRef(0)
  useEffect(() => {
    const fetchId = ++fetchRef.current
    setLoading(true)

    const params = new URLSearchParams({
      tab: activeTab,
      page: String(page),
      per_page: String(PAGE_SIZE),
    })
    if (debouncedSearch) params.set('search', debouncedSearch)
    if (genderFilter !== 'All') params.set('gender', genderFilter)
    if (hashkafaFilter) params.set('hashkafa', hashkafaFilter)
    if (labelFilter) params.set('label', labelFilter)
    if (activeTab === 'mine' && statusFilter) params.set('status', statusFilter)
    if (ageMin) params.set('age_min', ageMin)
    if (ageMax) params.set('age_max', ageMax)
    if (heightMin > 0) params.set('height_min', String(heightMin))
    if (heightMax > 0) params.set('height_max', String(heightMax))

    fetch(`/api/singles?${params}`)
      .then(r => r.json())
      .then(data => {
        if (fetchRef.current !== fetchId) return
        setSingles(data.singles ?? [])
        setTotal(data.total ?? 0)
        setTabTotals(prev => ({ ...prev, [activeTab]: data.total ?? 0 }))
        if (Array.isArray(data.labels_list) && data.labels_list.length > 0) {
          setLabelsList(data.labels_list)
        }
      })
      .catch(() => { /* ignore */ })
      .finally(() => {
        if (fetchRef.current === fetchId) setLoading(false)
      })
  }, [activeTab, page, debouncedSearch, genderFilter, statusFilter, hashkafaFilter, labelFilter, ageMin, ageMax, heightMin, heightMax])

  function switchTab(tab: ActiveTab) {
    setActiveTab(tab)
    setPage(1)
    setSearchInput('')
    setDebouncedSearch('')
    setGenderFilter('All')
    setStatusFilter('')
    setHashkafaFilter('')
    setLabelFilter('')
    setAgeMin('')
    setAgeMax('')
    setHeightMin(0)
    setHeightMax(0)
  }

  const handleRepresent = useCallback(async (singleId: string) => {
    const res = await fetch('/api/representation-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ single_id: singleId }),
    })
    if (res.ok || res.status === 409) {
      setSingles(prev => prev.map(s => s.id === singleId ? { ...s, rep_status: 'pending' } : s))
    }
  }, [])

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
              {tabTotals[tab] !== null ? tabTotals[tab] : '…'}
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
              value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); setPage(1) }}
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
              <option value="">All Statuses</option>
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
            <option value="">All Labels</option>
            {labelsList.map(label => (
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
                Showing <span className="font-medium text-[#555555]">{singles.length}</span> of{' '}
                <span className="font-medium text-[#555555]">{total}</span> singles
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
                    {singles.map((s, idx) => (
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
                        <td className="table-td">
                          <StatusBadge status={s.status ?? 'available'} />
                        </td>
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
                    {singles.length === 0 && (
                      <tr>
                        <td colSpan={10} className="text-center py-12 text-[#888888] text-sm">
                          {total === 0 ? 'No singles added yet.' : 'No singles match your filters.'}
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
                    {singles.map((s, idx) => (
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
                            {s.labels.map(label => (
                              <span key={label} className="text-xs bg-[#F8F0F5] text-brand-maroon px-2 py-0.5 rounded-full font-medium">
                                {label}
                              </span>
                            ))}
                            {s.labels.length === 0 && <span className="text-[#BBBBBB] text-xs">—</span>}
                          </div>
                        </td>
                        <td className="table-td">
                          <div className="flex items-center gap-1.5">
                            <Link href={`/dashboard/singles/${s.id}`}>
                              <Button variant="ghost" size="icon" className="h-7 w-7" title="View">
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                            {s.rep_status === 'pending' && (
                              <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                <Clock className="h-3 w-3" />Pending
                              </span>
                            )}
                            {s.rep_status === 'accepted' && (
                              <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />Representing
                              </span>
                            )}
                            {s.rep_status === 'declined' && (
                              <span className="text-xs text-[#888888] bg-gray-100 px-2 py-0.5 rounded-full">
                                Declined
                              </span>
                            )}
                            {s.rep_status === null && (
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
                    {singles.length === 0 && (
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
            {total > PAGE_SIZE && (
              <Pagination
                total={total}
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
