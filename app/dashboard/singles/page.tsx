'use client'

import { useState } from 'react'
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

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'My Singles', href: '/dashboard/singles', icon: Users },
  { label: 'Suggestions', href: '/dashboard/matches', icon: Heart },
  { label: 'Calendar', href: '/dashboard/tasks', icon: CalendarCheck },
  { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare, badge: '3' },
  { label: 'Groups', href: '/dashboard/groups', icon: UsersRound },
  { label: 'My Profile', href: '/dashboard/profile', icon: UserCircle },
]

// Shadchan's private labels (per-shadchan, not visible to other shadchanim)
const allSingles = [
  { id: '1', name: 'Yosef Goldstein', gender: 'Male', age: 26, city: 'Brooklyn, NY', status: 'available', labels: ['Yeshivish', 'Top priority'], dateAdded: 'Apr 1, 2026' },
  { id: '2', name: 'Devorah Friedman', gender: 'Female', age: 23, city: 'Lakewood, NJ', status: 'available', labels: ['Bais Yaakov', 'Ready to start'], dateAdded: 'Apr 3, 2026' },
  { id: '3', name: 'Shmuel Weiss', gender: 'Male', age: 28, city: 'Monsey, NY', status: 'on_hold', labels: ['Needs follow-up'], dateAdded: 'Mar 28, 2026' },
  { id: '4', name: 'Rivka Blum', gender: 'Female', age: 22, city: 'Baltimore, MD', status: 'draft', labels: [], dateAdded: 'Apr 10, 2026' },
  { id: '5', name: 'Menachem Katz', gender: 'Male', age: 25, city: 'Chicago, IL', status: 'available', labels: ['Yeshivish', 'Quick to decide'], dateAdded: 'Apr 5, 2026' },
  { id: '6', name: 'Chana Rosenberg', gender: 'Female', age: 24, city: 'Queens, NY', status: 'available', labels: ['Sephardic'], dateAdded: 'Apr 7, 2026' },
  { id: '7', name: 'Avraham Stern', gender: 'Male', age: 27, city: 'Passaic, NJ', status: 'inactive', labels: [], dateAdded: 'Mar 15, 2026' },
  { id: '8', name: 'Miriam Levine', gender: 'Female', age: 21, city: 'Cleveland, OH', status: 'available', labels: ['Bais Yaakov', 'Top priority'], dateAdded: 'Apr 12, 2026' },
  { id: '9', name: 'Pinchas Shapiro', gender: 'Male', age: 29, city: 'Teaneck, NJ', status: 'engaged', labels: ['Modern Orthodox'], dateAdded: 'Jan 10, 2026' },
  { id: '10', name: 'Leah Schwartz', gender: 'Female', age: 25, city: 'Silver Spring, MD', status: 'available', labels: ['Yeshivish', 'Ready to start'], dateAdded: 'Apr 14, 2026' },
]

// All unique labels across this shadchan's singles
const allLabels = Array.from(new Set(allSingles.flatMap((s) => s.labels))).sort()

export default function SinglesPage() {
  const [search, setSearch] = useState('')
  const [genderFilter, setGenderFilter] = useState<'All' | 'Male' | 'Female'>('All')
  const [statusFilter, setStatusFilter] = useState('all')
  const [labelFilter, setLabelFilter] = useState('all')
  const [page, setPage] = useState(1)
  const pageSize = 10

  const filtered = allSingles.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.city.toLowerCase().includes(search.toLowerCase())
    const matchesGender = genderFilter === 'All' || s.gender === genderFilter
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter
    const matchesLabel = labelFilter === 'all' || s.labels.includes(labelFilter)
    return matchesSearch && matchesGender && matchesStatus && matchesLabel
  })

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <AppLayout navItems={navItems} title="My Singles" role="shadchan">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-xl font-semibold text-[#1A1A1A]">My Singles</h1>
        <Link href="/dashboard/singles/new">
          <Button variant="primary" size="md" className="gap-2">
            <Plus className="h-4 w-4" />
            Add New Single
          </Button>
        </Link>
      </div>

      {/* Filters */}
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
            {(['All', 'Male', 'Female'] as const).map((g) => (
              <button
                key={g}
                onClick={() => { setGenderFilter(g); setPage(1) }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                  genderFilter === g
                    ? 'bg-brand-maroon text-white border-brand-maroon'
                    : 'border-gray-300 text-[#555555] hover:bg-gray-50'
                }`}
              >
                {g}
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

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <p className="text-xs text-[#888888]">
            Showing <span className="font-medium text-[#555555]">{filtered.length}</span> of{' '}
            <span className="font-medium text-[#555555]">{allSingles.length}</span> singles
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
                      {single.name}
                    </Link>
                  </td>
                  <td className="table-td text-[#555555]">{single.gender}</td>
                  <td className="table-td text-[#555555]">{single.age}</td>
                  <td className="table-td text-[#555555]">{single.city}</td>
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
                  <td className="table-td text-[#555555] whitespace-nowrap">{single.dateAdded}</td>
                  <td className="table-td">
                    {/* View only — shadchanim cannot edit single profiles */}
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
                    No singles match your filters.
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
      </div>
    </AppLayout>
  )
}
