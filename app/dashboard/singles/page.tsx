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
  SlidersHorizontal,
  Star,
  X,
  Handshake,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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
  in_my_list: boolean
  is_starred: boolean
}

type ActiveTab = 'mine' | 'all' | 'unrepresented'

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
  const [tabTotals, setTabTotals] = useState<{ mine: number | null; all: number | null; unrepresented: number | null }>({ mine: null, all: null, unrepresented: null })
  const [representingId, setRepresentingId] = useState<string | null>(null)
  const [labelsList, setLabelsList] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)

  // Filters
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [genderFilter, setGenderFilter] = useState<'All' | 'male' | 'female'>('All')
  const [statusFilter, setStatusFilter] = useState('')
  const [hashkafaFilter, setHashkafaFilter] = useState('')
  const [labelFilter, setLabelFilter] = useState('')
  const [starredFilter, setStarredFilter] = useState(false)
  const [ageMin, setAgeMin] = useState('')
  const [ageMax, setAgeMax] = useState('')
  const [heightMin, setHeightMin] = useState(0)
  const [heightMax, setHeightMax] = useState(0)

  const activeFilterCount = [
    genderFilter !== 'All',
    !!statusFilter,
    !!hashkafaFilter,
    !!labelFilter,
    starredFilter,
    !!ageMin || !!ageMax,
    heightMin > 0 || heightMax > 0,
  ].filter(Boolean).length

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

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
    if (starredFilter) params.set('starred', 'true')
    if (activeTab === 'mine' && statusFilter) params.set('status', statusFilter)
    if (ageMin) params.set('age_min', ageMin)
    if (ageMax) params.set('age_max', ageMax)
    if (heightMin > 0) params.set('height_min', String(heightMin))
    if (heightMax > 0) params.set('height_max', String(heightMax))

    fetch(`/api/singles?${params}`)
      .then(r => r.json())
      .then(data => {
        if (fetchRef.current !== fetchId) return
        const rows: ApiSingle[] = data.singles ?? []
        // Starred singles float to top of current page
        rows.sort((a, b) => (b.is_starred ? 1 : 0) - (a.is_starred ? 1 : 0))
        setSingles(rows)
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
  }, [activeTab, page, debouncedSearch, genderFilter, statusFilter, hashkafaFilter, labelFilter, starredFilter, ageMin, ageMax, heightMin, heightMax])

  function switchTab(tab: ActiveTab) {
    setActiveTab(tab)
    setPage(1)
    setSearchInput('')
    setDebouncedSearch('')
    setGenderFilter('All')
    setStatusFilter('')
    setHashkafaFilter('')
    setLabelFilter('')
    setStarredFilter(false)
    setAgeMin('')
    setAgeMax('')
    setHeightMin(0)
    setHeightMax(0)
    setRepresentingId(null)
  }

  const handleRepresent = useCallback(async (singleId: string) => {
    setRepresentingId(singleId)
    const res = await fetch(`/api/singles/${singleId}/represent`, { method: 'POST' })
    setRepresentingId(null)
    if (res.ok) {
      setSingles(prev => prev.filter(s => s.id !== singleId))
      setTotal(prev => Math.max(0, prev - 1))
      setTabTotals(prev => ({ ...prev, unrepresented: prev.unrepresented !== null ? Math.max(0, prev.unrepresented - 1) : null }))
    }
  }, [])

  function clearAllFilters() {
    setGenderFilter('All')
    setStatusFilter('')
    setHashkafaFilter('')
    setLabelFilter('')
    setStarredFilter(false)
    setAgeMin('')
    setAgeMax('')
    setHeightMin(0)
    setHeightMax(0)
    setPage(1)
  }

  const [familiarityPopup, setFamiliarityPopup] = useState<string | null>(null)

  const handleAddToList = useCallback(async (singleId: string) => {
    setSingles(prev => prev.map(s => s.id === singleId ? { ...s, in_my_list: true } : s))
    const res = await fetch(`/api/singles/${singleId}/add-to-my-list`, { method: 'POST' })
    if (!res.ok) {
      setSingles(prev => prev.map(s => s.id === singleId ? { ...s, in_my_list: false } : s))
      return
    }
    setFamiliarityPopup(singleId)
  }, [])

  const handleFamiliarityAnswer = useCallback(async (singleId: string, isFamiliar: boolean) => {
    setFamiliarityPopup(null)
    await fetch(`/api/singles/${singleId}/familiarity`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_familiar: isFamiliar }),
    })
  }, [])

  const handleToggleStar = useCallback(async (singleId: string, currentlyStarred: boolean) => {
    setSingles(prev => prev.map(s => s.id === singleId ? { ...s, is_starred: !currentlyStarred } : s))
    const res = await fetch(`/api/singles/${singleId}/star`, { method: 'POST' })
    if (!res.ok) {
      setSingles(prev => prev.map(s => s.id === singleId ? { ...s, is_starred: currentlyStarred } : s))
    }
  }, [])

  const handleStatusUpdate = useCallback(async (singleId: string, newStatus: string, prevStatus: string | null) => {
    setSingles(prev => prev.map(s => s.id === singleId ? { ...s, status: newStatus } : s))
    const res = await fetch(`/api/singles/${singleId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (!res.ok) {
      setSingles(prev => prev.map(s => s.id === singleId ? { ...s, status: prevStatus } : s))
    }
  }, [])

  // Secondary filters panel (shared between desktop card and mobile drawer)
  function FilterControls() {
    return (
      <div className="space-y-4">
        {/* Gender */}
        <div>
          <p className="text-xs font-medium text-[#555555] mb-2">Gender</p>
          <div className="flex gap-2">
            {(['All', 'male', 'female'] as const).map(g => (
              <button
                key={g}
                onClick={() => { setGenderFilter(g); setPage(1) }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors border ${
                  genderFilter === g
                    ? 'bg-brand-maroon text-white border-brand-maroon'
                    : 'border-gray-300 text-[#555555]'
                }`}
              >
                {g === 'All' ? 'All' : g === 'male' ? 'Male' : 'Female'}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'mine' && (
          <div>
            <p className="text-xs font-medium text-[#555555] mb-2">Status</p>
            <select className="input-base w-full" value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}>
              <option value="">All Statuses</option>
              <option value="available">Available</option>
              <option value="draft">Draft</option>
              <option value="on_hold">On Hold</option>
              <option value="engaged">Engaged</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        )}

        <div>
          <p className="text-xs font-medium text-[#555555] mb-2">Hashkafa</p>
          <select className="input-base w-full" value={hashkafaFilter}
            onChange={(e) => { setHashkafaFilter(e.target.value); setPage(1) }}>
            {HASHKAFA_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {labelsList.length > 0 && (
          <div>
            <p className="text-xs font-medium text-[#555555] mb-2">Label</p>
            <select className="input-base w-full" value={labelFilter}
              onChange={(e) => { setLabelFilter(e.target.value); setPage(1) }}>
              <option value="">All Labels</option>
              {labelsList.map(label => (
                <option key={label} value={label}>{label}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <p className="text-xs font-medium text-[#555555] mb-2">Starred</p>
          <button
            onClick={() => { setStarredFilter(v => !v); setPage(1) }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
              starredFilter ? 'bg-amber-50 border-amber-400 text-amber-600' : 'border-gray-300 text-[#555555]'
            }`}
          >
            <Star className={`h-4 w-4 ${starredFilter ? 'fill-amber-400 text-amber-400' : ''}`} />
            Starred only
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-medium text-[#555555] mb-2">Age Range</p>
            <div className="flex items-center gap-1.5">
              <input type="number" placeholder="Min" className="input-base w-full text-center"
                value={ageMin} min={16} max={99}
                onChange={(e) => { setAgeMin(e.target.value); setPage(1) }} />
              <span className="text-xs text-[#888888]">–</span>
              <input type="number" placeholder="Max" className="input-base w-full text-center"
                value={ageMax} min={16} max={99}
                onChange={(e) => { setAgeMax(e.target.value); setPage(1) }} />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-[#555555] mb-2">Height</p>
            <div className="flex items-center gap-1.5">
              <select className="input-base w-full" value={heightMin}
                onChange={(e) => { setHeightMin(parseInt(e.target.value, 10)); setPage(1) }}>
                {HEIGHT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.value === 0 ? 'Min' : o.label}</option>
                ))}
              </select>
              <span className="text-xs text-[#888888]">–</span>
              <select className="input-base w-full" value={heightMax}
                onChange={(e) => { setHeightMax(parseInt(e.target.value, 10)); setPage(1) }}>
                {HEIGHT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.value === 0 ? 'Max' : o.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <AppLayout navItems={navItems} title="Singles" role="shadchan">
      {/* Mobile filter drawer backdrop */}
      {filterDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setFilterDrawerOpen(false)}
        />
      )}

      {/* Mobile filter drawer */}
      <div className={`fixed inset-x-0 bottom-16 z-50 bg-white rounded-t-2xl shadow-2xl border-t border-gray-100 transition-transform duration-300 md:hidden ${filterDrawerOpen ? 'translate-y-0' : 'translate-y-full pointer-events-none'}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <span className="text-sm font-semibold text-[#1A1A1A]">Filters</span>
          <div className="flex items-center gap-3">
            {activeFilterCount > 0 && (
              <button onClick={clearAllFilters} className="text-xs text-brand-maroon font-medium">
                Clear all
              </button>
            )}
            <button onClick={() => setFilterDrawerOpen(false)} className="p-1.5 rounded-full hover:bg-gray-100">
              <X className="h-5 w-5 text-[#555555]" />
            </button>
          </div>
        </div>
        <div className="p-5 overflow-y-auto max-h-[70dvh]">
          <FilterControls />
          <Button
            onClick={() => setFilterDrawerOpen(false)}
            className="w-full mt-5 btn-primary min-h-[44px]"
          >
            Show {total} results
          </Button>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <h1 className="text-xl font-semibold text-[#1A1A1A]">Singles</h1>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/singles/quick-add">
            <Button variant="secondary" size="md" className="gap-2 min-h-[44px]">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Quick Add</span>
            </Button>
          </Link>
          <Link href="/dashboard/singles/new">
            <Button variant="primary" size="md" className="gap-2 min-h-[44px]">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add New Single</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-4">
        {([
          { key: 'mine', label: 'My Singles' },
          { key: 'all', label: 'All Singles' },
          { key: 'unrepresented', label: 'Unrepresented' },
        ] as { key: ActiveTab; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => switchTab(key)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors min-h-[44px] ${
              activeTab === key
                ? 'border-brand-maroon text-brand-maroon'
                : 'border-transparent text-[#888888] hover:text-[#555555]'
            }`}
          >
            {label}
            <span className={`ml-2 text-xs font-bold px-1.5 py-0.5 rounded-full ${
              key === 'unrepresented' && tabTotals.unrepresented ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {tabTotals[key] !== null ? tabTotals[key] : '…'}
            </span>
          </button>
        ))}
      </div>

      {/* Search + Filter row */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#888888]" />
          <input
            className="input-base ps-9 w-full min-h-[44px]"
            placeholder="Search by name, city, or plans…"
            value={searchInput}
            onChange={(e) => { setSearchInput(e.target.value); setPage(1) }}
          />
        </div>
        {/* Mobile: Filters button */}
        <button
          onClick={() => setFilterDrawerOpen(true)}
          className={`md:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium min-h-[44px] flex-shrink-0 ${
            activeFilterCount > 0
              ? 'bg-brand-maroon text-white border-brand-maroon'
              : 'border-gray-300 text-[#555555]'
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-white/30 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Desktop filters */}
      <div className="hidden md:block card mb-4">
        <div className="flex flex-wrap gap-3 items-center">
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

          <button
            onClick={() => { setStarredFilter(v => !v); setPage(1) }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
              starredFilter ? 'bg-amber-50 border-amber-400 text-amber-600' : 'border-gray-300 text-[#555555] hover:bg-gray-50'
            }`}
          >
            <Star className={`h-4 w-4 ${starredFilter ? 'fill-amber-400 text-amber-400' : ''}`} />
            Starred
          </button>

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

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-[#888888] text-sm">Loading…</div>
      ) : (
        <>
          <p className="text-xs text-[#888888] mb-3">
            Showing <span className="font-medium text-[#555555]">{singles.length}</span> of{' '}
            <span className="font-medium text-[#555555]">{total}</span> singles
          </p>

          {/* Mobile: Card list */}
          <div className="md:hidden space-y-2">
            {singles.length === 0 ? (
              <div className="py-12 text-center text-[#888888] text-sm card">
                {total === 0 ? 'No singles added yet.' : 'No singles match your filters.'}
              </div>
            ) : (
              singles.map((s) => (
                <div key={s.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <Link href={`/dashboard/singles/${s.id}`} className="text-base font-semibold text-[#1A1A1A] block truncate hover:text-brand-maroon">
                        {s.first_name} {s.last_name}
                      </Link>
                      <p className="text-xs text-[#888888] mt-0.5 capitalize">
                        {s.gender === 'male' ? 'Male' : 'Female'}
                        {s.age ? ` · Age ${s.age}` : ''}
                        {[s.city, s.state].filter(Boolean).length > 0 ? ` · ${[s.city, s.state].filter(Boolean).join(', ')}` : ''}
                        {s.hashkafa ? ` · ${s.hashkafa.replace('_', ' ')}` : ''}
                      </p>
                    </div>
                    {activeTab === 'mine' ? (
                      <select
                        className="input-base text-xs py-0.5 px-1.5 w-auto min-w-[100px] flex-shrink-0"
                        value={s.status ?? 'available'}
                        onChange={(e) => handleStatusUpdate(s.id, e.target.value, s.status)}
                      >
                        <option value="draft">Draft</option>
                        <option value="available">Available</option>
                        <option value="on_hold">On Hold</option>
                        <option value="engaged">Engaged</option>
                        <option value="married">Married</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    ) : (
                      <StatusBadge status={s.status ?? 'available'} />
                    )}
                  </div>
                  {s.labels.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {s.labels.map(label => (
                        <span key={label} className="text-xs bg-[#F8F0F5] text-brand-maroon px-2 py-0.5 rounded-full font-medium">
                          {label}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                    <button
                      onClick={() => handleToggleStar(s.id, s.is_starred)}
                      className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                        s.is_starred ? 'text-amber-500' : 'text-gray-300 hover:text-amber-400'
                      }`}
                      aria-label={s.is_starred ? 'Unstar' : 'Star'}
                    >
                      <Star className={`h-5 w-5 ${s.is_starred ? 'fill-amber-400' : ''}`} />
                    </button>
                    <Link href={`/dashboard/singles/${s.id}`} className="flex-1">
                      <Button variant="ghost" size="sm" className="w-full gap-1.5 min-h-[40px]">
                        <Eye className="h-3.5 w-3.5" />
                        View Profile
                      </Button>
                    </Link>
                    {activeTab === 'all' && (
                      <>
                        {s.in_my_list ? (
                          <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full inline-flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />Added
                          </span>
                        ) : (
                          <Button variant="ghost" size="sm" className="gap-1.5 min-h-[40px]"
                            onClick={() => handleAddToList(s.id)}>
                            <UserPlus className="h-3.5 w-3.5" />
                            Add to My List
                          </Button>
                        )}
                        {s.shadchan_name !== '—' && (
                          <span className="text-xs text-[#888888] ml-auto">{s.shadchan_name}</span>
                        )}
                      </>
                    )}
                    {activeTab === 'unrepresented' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 min-h-[40px] text-brand-maroon"
                        disabled={representingId === s.id}
                        onClick={() => handleRepresent(s.id)}
                      >
                        <Handshake className="h-3.5 w-3.5" />
                        {representingId === s.id ? 'Claiming…' : 'Represent'}
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop: Table */}
          <div className="hidden md:block card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              {activeTab === 'mine' ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="table-th w-8">#</th>
                      <th className="table-th w-8"></th>
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
                        <td className="table-td">
                          <button onClick={() => handleToggleStar(s.id, s.is_starred)} className="p-0.5" aria-label={s.is_starred ? 'Unstar' : 'Star'}>
                            <Star className={`h-4 w-4 ${s.is_starred ? 'fill-amber-400 text-amber-400' : 'text-gray-300 hover:text-amber-400'}`} />
                          </button>
                        </td>
                        <td className="table-td font-medium text-[#1A1A1A]">
                          <Link href={`/dashboard/singles/${s.id}`} className="hover:text-brand-maroon transition-colors">
                            {s.first_name} {s.last_name}
                          </Link>
                        </td>
                        <td className="table-td text-[#555555]">{s.gender === 'male' ? 'Male' : 'Female'}</td>
                        <td className="table-td text-[#555555]">{s.age ?? '—'}</td>
                        <td className="table-td text-[#555555]">{[s.city, s.state].filter(Boolean).join(', ') || '—'}</td>
                        <td className="table-td text-[#555555] capitalize">{(s.hashkafa ?? '—').replace('_', ' ')}</td>
                        <td className="table-td">
                          <select
                            className="input-base text-xs py-0.5 px-1.5 w-auto min-w-[110px]"
                            value={s.status ?? 'available'}
                            onChange={(e) => handleStatusUpdate(s.id, e.target.value, s.status)}
                          >
                            <option value="draft">Draft</option>
                            <option value="available">Available</option>
                            <option value="on_hold">On Hold</option>
                            <option value="engaged">Engaged</option>
                            <option value="married">Married</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </td>
                        <td className="table-td">
                          <div className="flex flex-wrap gap-1">
                            {s.labels.map(label => (
                              <span key={label} className="text-xs bg-[#F8F0F5] text-brand-maroon px-2 py-0.5 rounded-full font-medium">{label}</span>
                            ))}
                            {s.labels.length === 0 && <span className="text-[#BBBBBB] text-xs">—</span>}
                          </div>
                        </td>
                        <td className="table-td text-[#555555] whitespace-nowrap">
                          {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="table-td">
                          <Link href={`/dashboard/singles/${s.id}`}>
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="View"><Eye className="h-3.5 w-3.5" /></Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {singles.length === 0 && (
                      <tr><td colSpan={11} className="text-center py-12 text-[#888888] text-sm">
                        {total === 0 ? 'No singles added yet.' : 'No singles match your filters.'}
                      </td></tr>
                    )}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="table-th w-8">#</th>
                      <th className="table-th w-8"></th>
                      <th className="table-th">Name</th>
                      <th className="table-th">Gender</th>
                      <th className="table-th">Age</th>
                      <th className="table-th">City</th>
                      <th className="table-th">Hashkafa</th>
                      {activeTab === 'all' && <th className="table-th">Shadchan</th>}
                      <th className="table-th">Your Labels</th>
                      <th className="table-th">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {singles.map((s, idx) => (
                      <tr key={s.id} className="table-row">
                        <td className="table-td text-[#888888]">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                        <td className="table-td">
                          <button onClick={() => handleToggleStar(s.id, s.is_starred)} className="p-0.5" aria-label={s.is_starred ? 'Unstar' : 'Star'}>
                            <Star className={`h-4 w-4 ${s.is_starred ? 'fill-amber-400 text-amber-400' : 'text-gray-300 hover:text-amber-400'}`} />
                          </button>
                        </td>
                        <td className="table-td font-medium text-[#1A1A1A]">
                          <Link href={`/dashboard/singles/${s.id}`} className="hover:text-brand-maroon transition-colors">
                            {s.first_name} {s.last_name}
                          </Link>
                        </td>
                        <td className="table-td text-[#555555]">{s.gender === 'male' ? 'Male' : 'Female'}</td>
                        <td className="table-td text-[#555555]">{s.age ?? '—'}</td>
                        <td className="table-td text-[#555555]">{[s.city, s.state].filter(Boolean).join(', ') || '—'}</td>
                        <td className="table-td text-[#555555] capitalize">{(s.hashkafa ?? '—').replace('_', ' ')}</td>
                        {activeTab === 'all' && <td className="table-td text-[#555555] text-xs">{s.shadchan_name}</td>}
                        <td className="table-td">
                          <div className="flex flex-wrap gap-1">
                            {s.labels.map(label => (
                              <span key={label} className="text-xs bg-[#F8F0F5] text-brand-maroon px-2 py-0.5 rounded-full font-medium">{label}</span>
                            ))}
                            {s.labels.length === 0 && <span className="text-[#BBBBBB] text-xs">—</span>}
                          </div>
                        </td>
                        <td className="table-td">
                          <div className="flex items-center gap-1.5">
                            <Link href={`/dashboard/singles/${s.id}`}>
                              <Button variant="ghost" size="icon" className="h-7 w-7" title="View"><Eye className="h-3.5 w-3.5" /></Button>
                            </Link>
                            {activeTab === 'all' && (s.in_my_list ? (
                              <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />Added
                              </span>
                            ) : (
                              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => handleAddToList(s.id)}>
                                <UserPlus className="h-3 w-3" />Add to My List
                              </Button>
                            ))}
                            {activeTab === 'unrepresented' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 gap-1 text-xs text-brand-maroon"
                                disabled={representingId === s.id}
                                onClick={() => handleRepresent(s.id)}
                              >
                                <Handshake className="h-3 w-3" />
                                {representingId === s.id ? 'Claiming…' : 'Represent'}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {singles.length === 0 && (
                      <tr><td colSpan={activeTab === 'all' ? 10 : 9} className="text-center py-12 text-[#888888] text-sm">
                        {activeTab === 'unrepresented' ? 'No unrepresented singles.' : 'No singles match your filters.'}
                      </td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
            {total > PAGE_SIZE && (
              <Pagination total={total} page={page} pageSize={PAGE_SIZE} onPageChange={setPage} />
            )}
          </div>

          {/* Mobile pagination */}
          {total > PAGE_SIZE && (
            <div className="md:hidden mt-3">
              <Pagination total={total} page={page} pageSize={PAGE_SIZE} onPageChange={setPage} />
            </div>
          )}
        </>
      )}
      <Dialog open={familiarityPopup !== null} onOpenChange={(open) => { if (!open) setFamiliarityPopup(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Are you familiar with this single?</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-2">
            <p className="text-sm text-[#555555]">
              Are you personally familiar with this single — do you know them, their family, or their background?
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="secondary" onClick={() => familiarityPopup && handleFamiliarityAnswer(familiarityPopup, false)}>
              No
            </Button>
            <Button variant="primary" onClick={() => familiarityPopup && handleFamiliarityAnswer(familiarityPopup, true)}>
              Yes, I Know Them
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
