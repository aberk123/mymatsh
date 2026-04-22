'use client'

import { useEffect, useState } from 'react'
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
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import type { NavItem } from '@/components/ui/sidebar'
import { createClient } from '@/lib/supabase/client'

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

interface SingleRow {
  id: string
  first_name: string
  last_name: string
  gender: string
  age: number | null
  city: string | null
  state: string | null
  status: string
  created_by_shadchan_id: string
  shadchanName?: string
}

export default function AdminSinglesPage() {
  const [gender, setGender] = useState<Gender>('boys')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [singles, setSingles] = useState<SingleRow[]>([])
  const [statusModalId, setStatusModalId] = useState<string | null>(null)
  const [newStatus, setNewStatus] = useState<SingleStatus>('available')
  const [statusSaving, setStatusSaving] = useState(false)
  const [statusError, setStatusError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const supabase = createClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rows } = await (supabase.from('singles') as any)
      .select('id, first_name, last_name, gender, age, city, state, status, created_by_shadchan_id')
      .order('first_name', { ascending: true }) as { data: SingleRow[] | null }

    const all = rows ?? []

    // Resolve shadchan names
    const shadchanIds = Array.from(new Set(all.map((s) => s.created_by_shadchan_id).filter(Boolean)))
    let shadchanMap: Record<string, string> = {}
    if (shadchanIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profiles } = await (supabase.from('shadchan_profiles') as any)
        .select('id, full_name')
        .in('id', shadchanIds) as { data: Array<{ id: string; full_name: string }> | null }
      shadchanMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name]))
    }

    setSingles(all.map((s) => ({ ...s, shadchanName: shadchanMap[s.created_by_shadchan_id] ?? '—' })))
    setLoading(false)
  }

  const filtered = singles.filter(
    (s) =>
      (s.gender === 'male' ? gender === 'boys' : gender === 'girls') &&
      (`${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
        (s.city ?? '').toLowerCase().includes(search.toLowerCase()))
  )

  const boysCount = singles.filter((s) => s.gender === 'male').length
  const girlsCount = singles.filter((s) => s.gender === 'female').length

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
          onClick={() => setGender('boys')}
        >
          Boys
          <span className="ml-2 bg-gray-100 text-gray-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
            {boysCount}
          </span>
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            gender === 'girls'
              ? 'border-brand-pink text-brand-pink'
              : 'border-transparent text-[#888888] hover:text-[#555555]'
          }`}
          onClick={() => setGender('girls')}
        >
          Girls
          <span className="ml-2 bg-gray-100 text-gray-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
            {girlsCount}
          </span>
        </button>
      </div>

      <div className="card">
        <div className="relative mb-4 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#888888]" />
          <Input
            placeholder="Search singles..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-[#888888] text-sm">Loading…</div>
        ) : (
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
                {filtered.map((s) => (
                  <tr key={s.id} className="table-row">
                    <td className="table-td font-medium text-[#1A1A1A]">{s.first_name} {s.last_name}</td>
                    <td className="table-td text-[#555555]">{s.age ?? '—'}</td>
                    <td className="table-td text-[#555555]">{[s.city, s.state].filter(Boolean).join(', ') || '—'}</td>
                    <td className="table-td text-[#555555]">{s.shadchanName}</td>
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
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="table-td text-center text-[#888888] py-8">
                      No {gender} found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
