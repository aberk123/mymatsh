'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Building2,
  Heart,
  Newspaper,
  DollarSign,
  ClipboardList,
  Search,
  RefreshCw,
  UsersRound,
  Home,
  BookOpen,
  MessageSquare,
  Upload,
  PackageOpen,
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Pagination } from '@/components/ui/pagination'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import type { NavItem } from '@/components/ui/sidebar'

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Shadchanim', href: '/admin/shadchanim', icon: UserCheck },
  { label: 'Singles', href: '/admin/singles', icon: UsersRound },
  { label: 'Parents', href: '/admin/parents', icon: Home },
  { label: 'Advocates', href: '/admin/advocates', icon: Heart },
  { label: 'Maschilim', href: '/admin/maschilim', icon: BookOpen },
  { label: 'Messages', href: '/admin/messages', icon: MessageSquare },
  { label: 'Organizations', href: '/admin/organizations', icon: Building2 },
  { label: 'News', href: '/admin/news', icon: Newspaper },
  { label: 'Donations', href: '/admin/donations', icon: DollarSign },
  { label: 'Audit Log', href: '/admin/audit-log', icon: ClipboardList },
  { label: 'Import Batches', href: '/admin/import-batches', icon: PackageOpen },
]

type Gender = 'boys' | 'girls'
type SingleStatus = 'available' | 'on_hold' | 'engaged' | 'married' | 'inactive'

const STATUS_OPTIONS: { value: SingleStatus; label: string }[] = [
  { value: 'available', label: 'Available' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'engaged', label: 'Engaged' },
  { value: 'married', label: 'Married' },
  { value: 'inactive', label: 'Inactive' },
]

const PAGE_SIZE = 25

interface SingleRow {
  id: string
  first_name: string
  last_name: string
  gender: string
  age: number | null
  city: string | null
  state: string | null
  status: string
  shadchan_name: string
}

export default function AdminSinglesPage() {
  const router = useRouter()
  const [gender, setGender] = useState<Gender>('boys')
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [singles, setSingles] = useState<SingleRow[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [genderTotals, setGenderTotals] = useState<{ boys: number | null; girls: number | null }>({ boys: null, girls: null })
  const [statusModalId, setStatusModalId] = useState<string | null>(null)
  const [newStatus, setNewStatus] = useState<SingleStatus>('available')
  const [statusSaving, setStatusSaving] = useState(false)
  const [statusError, setStatusError] = useState('')

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Fetch initial counts for both gender tabs
  useEffect(() => {
    fetch('/api/singles?gender=male&page=1&per_page=1')
      .then(r => r.json())
      .then(d => setGenderTotals(prev => ({ ...prev, boys: d.total ?? 0 })))
    fetch('/api/singles?gender=female&page=1&per_page=1')
      .then(r => r.json())
      .then(d => setGenderTotals(prev => ({ ...prev, girls: d.total ?? 0 })))
  }, [])

  // Main data fetch
  const fetchRef = useRef(0)
  useEffect(() => {
    const fetchId = ++fetchRef.current
    setLoading(true)

    const params = new URLSearchParams({
      gender: gender === 'boys' ? 'male' : 'female',
      page: String(page),
      per_page: String(PAGE_SIZE),
    })
    if (debouncedSearch) params.set('search', debouncedSearch)

    fetch(`/api/singles?${params}`)
      .then(r => r.json())
      .then(data => {
        if (fetchRef.current !== fetchId) return
        setSingles(data.singles ?? [])
        setTotal(data.total ?? 0)
      })
      .catch(() => { /* ignore */ })
      .finally(() => {
        if (fetchRef.current === fetchId) setLoading(false)
      })
  }, [gender, debouncedSearch, page])

  function switchGender(g: Gender) {
    setGender(g)
    setPage(1)
  }

  const updating = singles.find((s) => s.id === statusModalId)

  function openStatusModal(id: string) {
    const s = singles.find((x) => x.id === id)
    if (s) {
      setNewStatus(s.status as SingleStatus)
      setStatusError('')
      setStatusModalId(id)
    }
  }

  async function handleStatusSave() {
    if (!statusModalId) return
    setStatusSaving(true)
    setStatusError('')
    try {
      const res = await fetch(`/api/admin/singles/${statusModalId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        const json = await res.json()
        setStatusError(json.error ?? 'Failed to update status.')
        return
      }
      setSingles((prev) =>
        prev.map((s) => (s.id === statusModalId ? { ...s, status: newStatus } : s))
      )
      setStatusModalId(null)
    } catch {
      setStatusError('Network error. Please try again.')
    } finally {
      setStatusSaving(false)
    }
  }

  return (
    <AppLayout navItems={navItems} title="Singles" role="platform_admin">
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            gender === 'boys'
              ? 'border-brand-pink text-brand-pink'
              : 'border-transparent text-[#888888] hover:text-[#555555]'
          }`}
          onClick={() => switchGender('boys')}
        >
          Boys
          <span className="ml-2 bg-gray-100 text-gray-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
            {genderTotals.boys !== null ? genderTotals.boys : '…'}
          </span>
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            gender === 'girls'
              ? 'border-brand-pink text-brand-pink'
              : 'border-transparent text-[#888888] hover:text-[#555555]'
          }`}
          onClick={() => switchGender('girls')}
        >
          Girls
          <span className="ml-2 bg-gray-100 text-gray-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
            {genderTotals.girls !== null ? genderTotals.girls : '…'}
          </span>
        </button>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#888888]" />
            <Input
              placeholder="Search singles..."
              className="pl-9"
              value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); setPage(1) }}
            />
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="gap-1.5 ml-auto"
            onClick={() => router.push('/admin/import-upload')}
          >
            <Upload className="h-3.5 w-3.5" />
            Import from Evernote
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-[#888888] text-sm">Loading…</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="table-th">Name</th>
                    <th className="table-th">Age</th>
                    <th className="table-th">City</th>
                    <th className="table-th">Shadchan</th>
                    <th className="table-th">Status</th>
                    <th className="table-th">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {singles.map((s) => (
                    <tr key={s.id} className="table-row">
                      <td className="table-td font-medium text-[#1A1A1A]">{s.first_name} {s.last_name}</td>
                      <td className="table-td text-[#555555]">{s.age ?? '—'}</td>
                      <td className="table-td text-[#555555]">{[s.city, s.state].filter(Boolean).join(', ') || '—'}</td>
                      <td className="table-td text-[#555555]">{s.shadchan_name}</td>
                      <td className="table-td"><StatusBadge status={s.status} /></td>
                      <td className="table-td">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1"
                          onClick={() => openStatusModal(s.id)}
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          Update Status
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {singles.length === 0 && (
                    <tr>
                      <td colSpan={6} className="table-td text-center text-[#888888] py-8">
                        No {gender} found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {total > PAGE_SIZE && (
              <Pagination
                total={total}
                page={page}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
                className="border-t border-gray-100"
              />
            )}
          </>
        )}
      </div>

      <Dialog open={statusModalId !== null} onOpenChange={(open) => { if (!open) setStatusModalId(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Update Status</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-2 space-y-3">
            <p className="text-sm text-[#555555]">
              Updating status for{' '}
              <span className="font-semibold text-[#1A1A1A]">
                {updating ? `${updating.first_name} ${updating.last_name}` : ''}
              </span>.
            </p>
            <div>
              <Label className="field-label">New Status</Label>
              <select
                className="input-base mt-1 w-full"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as SingleStatus)}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {statusError && (
              <p className="text-xs text-red-600">{statusError}</p>
            )}
            <p className="text-xs text-[#888888]">
              Only status can be updated here. Personal profile details are managed by the assigned Shadchan.
            </p>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setStatusModalId(null)} disabled={statusSaving}>Cancel</Button>
            <Button onClick={handleStatusSave} disabled={statusSaving}>
              {statusSaving ? 'Saving…' : 'Save Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
