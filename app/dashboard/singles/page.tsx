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
  Search,
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/ui/pagination'
import type { NavItem } from '@/components/ui/sidebar'
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

interface SingleRow {
  id: string
  first_name: string
  last_name: string
  gender: string
  age: number | null
  city: string | null
  state: string | null
  status: string
  created_at: string
  labels: string[]
}

export default function SinglesPage() {
  const [loading, setLoading] = useState(true)
  const [singles, setSingles] = useState<SingleRow[]>([])
  const [allLabels, setAllLabels] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [genderFilter, setGenderFilter] = useState<'All' | 'male' | 'female'>('All')
  const [statusFilter, setStatusFilter] = useState('all')
  const [labelFilter, setLabelFilter] = useState('all')
  const [page, setPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      // Get shadchan profile
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (supabase.from('shadchan_profiles') as any)
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle() as { data: { id: string } | null }

      if (!profile) { setLoading(false); return }

      // Load singles created by this shadchan
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: singlesData } = await (supabase.from('singles') as any)
        .select('id, first_name, last_name, gender, age, city, state, status, created_at')
        .eq('created_by_shadchan_id', profile.id)
        .order('created_at', { ascending: false }) as {
          data: Array<{
            id: string
            first_name: string
            last_name: string
            gender: string
            age: number | null
            city: string | null
            state: string | null
            status: string
            created_at: string
          }> | null
        }

      const singleRows = singlesData ?? []
      if (singleRows.length === 0) { setLoading(false); return }

      const singleIds = singleRows.map((s) => s.id)

      // Load this shadchan's labels
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: labelsData } = await (supabase.from('labels') as any)
        .select('id, name')
        .eq('shadchan_id', profile.id) as { data: Array<{ id: string; name: string }> | null }

      const labelById: Record<string, string> = {}
      for (const l of labelsData ?? []) labelById[l.id] = l.name

      // Load single_labels for these singles
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: singleLabelsData } = await (supabase.from('single_labels') as any)
        .select('single_id, label_id')
        .in('single_id', singleIds) as { data: Array<{ single_id: string; label_id: string }> | null }

      const labelsBySingle: Record<string, string[]> = {}
      for (const sl of singleLabelsData ?? []) {
        if (!labelsBySingle[sl.single_id]) labelsBySingle[sl.single_id] = []
        const name = labelById[sl.label_id]
        if (name) labelsBySingle[sl.single_id].push(name)
      }

      const result: SingleRow[] = singleRows.map((s) => ({
        ...s,
        labels: labelsBySingle[s.id] ?? [],
      }))

      setSingles(result)
      const uniqueLabels = Array.from(new Set(result.flatMap((s) => s.labels))).sort()
      setAllLabels(uniqueLabels)
      setLoading(false)
    }
    load()
  }, [])

  const filtered = singles.filter((s) => {
    const location = [s.city, s.state].filter(Boolean).join(', ')
    const matchesSearch =
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      location.toLowerCase().includes(search.toLowerCase())
    const matchesGender = genderFilter === 'All' || s.gender === genderFilter
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter
    const matchesLabel = labelFilter === 'all' || s.labels.includes(labelFilter)
    return matchesSearch && matchesGender && matchesStatus && matchesLabel
  })

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <AppLayout navItems={navItems} title="My Singles" role="shadchan">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-xl font-semibold text-[#1A1A1A]">My Singles</h1>
        <Link href="/dashboard/singles/new">
          <Button variant="primary" size="md" className="gap-2">
            <Plus className="h-4 w-4" />
            Add New Single
          </Button>
        </Link>
      </div>

      <div className="card mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#888888]" />
            <input
              className="input-base ps-9"
              placeholder="Search by name or city…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
          <div className="flex gap-2">
            {(['All', 'male', 'female'] as const).map((g) => (
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
          <select
            className="input-base w-auto min-w-[140px]"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          >
            <option value="all">All Statuses</option>
            <option value="available">Available</option>
            <option value="draft">Draft</option>
            <option value="on_hold">On Hold</option>
            <option value="engaged">Engaged</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            className="input-base w-auto min-w-[140px]"
            value={labelFilter}
            onChange={(e) => { setLabelFilter(e.target.value); setPage(1) }}
          >
            <option value="all">All Labels</option>
            {allLabels.map((label) => (
              <option key={label} value={label}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-[#888888] text-sm">Loading…</div>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <p className="text-xs text-[#888888]">
                Showing <span className="font-medium text-[#555555]">{filtered.length}</span> of{' '}
                <span className="font-medium text-[#555555]">{singles.length}</span> singles
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="table-th w-8">#</th>
                    <th className="table-th">Name</th>
                    <th className="table-th">Gender</th>
                    <th className="table-th">Age</th>
                    <th className="table-th">City</th>
                    <th className="table-th">Status</th>
                    <th className="table-th">Your Labels</th>
                    <th className="table-th">Date Added</th>
                    <th className="table-th">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((single, idx) => (
                    <tr key={single.id} className="table-row">
                      <td className="table-td text-[#888888]">{(page - 1) * pageSize + idx + 1}</td>
                      <td className="table-td font-medium text-[#1A1A1A]">
                        <Link href={`/dashboard/singles/${single.id}`} className="hover:text-brand-maroon transition-colors">
                          {single.first_name} {single.last_name}
                        </Link>
                      </td>
                      <td className="table-td text-[#555555]">
                        {single.gender === 'male' ? 'Male' : 'Female'}
                      </td>
                      <td className="table-td text-[#555555]">{single.age ?? '—'}</td>
                      <td className="table-td text-[#555555]">
                        {[single.city, single.state].filter(Boolean).join(', ') || '—'}
                      </td>
                      <td className="table-td">
                        <StatusBadge status={single.status} />
                      </td>
                      <td className="table-td">
                        <div className="flex flex-wrap gap-1">
                          {single.labels.map((label) => (
                            <span key={label} className="text-xs bg-[#F8F0F5] text-brand-maroon px-2 py-0.5 rounded-full font-medium">
                              {label}
                            </span>
                          ))}
                          {single.labels.length === 0 && <span className="text-[#BBBBBB] text-xs">—</span>}
                        </div>
                      </td>
                      <td className="table-td text-[#555555] whitespace-nowrap">
                        {new Date(single.created_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </td>
                      <td className="table-td">
                        <Link href={`/dashboard/singles/${single.id}`}>
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="View">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {paginated.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-[#888888] text-sm">
                        {singles.length === 0 ? 'No singles added yet.' : 'No singles match your filters.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {filtered.length > pageSize && (
              <Pagination
                total={filtered.length}
                page={page}
                pageSize={pageSize}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}
