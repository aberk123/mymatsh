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
  CheckCircle,
  XCircle,
  UserPlus,
  UsersRound,
  Home,
  BookOpen,
  MessageSquare,
  PackageOpen,
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { AddShadchanModal } from '@/components/admin/add-shadchan-modal'
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
  { label: 'Import Batches', href: '/admin/import-batches', icon: PackageOpen },
]

interface PendingShadchan {
  id: string
  user_id: string
  name: string
  city: string
  email: string
  phone: string
  references: number
  dateApplied: string
}

interface ApprovedShadchan {
  id: string
  name: string
  city: string
  email: string
  approvedDate: string
  status: string
  matchesMade: number
  singlesManaged: number
  addedBy: string
  approvedBy: string
}

export default function AdminShadchanimPage() {
  const [tab, setTab] = useState<'pending' | 'all'>('pending')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [pendingList, setPendingList] = useState<PendingShadchan[]>([])
  const [approvedList, setApprovedList] = useState<ApprovedShadchan[]>([])
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')
  const [addOpen, setAddOpen] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const supabase = createClient()

    // Pending: is_approved = false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: pending } = await (supabase.from('shadchan_profiles') as any)
      .select('id, user_id, full_name, city, state, email, phone, reference_1, reference_2, created_at')
      .eq('is_approved', false)
      .order('created_at', { ascending: false }) as {
        data: Array<{
          id: string
          user_id: string
          full_name: string
          city: string | null
          state: string | null
          email: string | null
          phone: string | null
          reference_1: string | null
          reference_2: string | null
          created_at: string
        }> | null
      }

    setPendingList(
      (pending ?? []).map((p) => ({
        id: p.id,
        user_id: p.user_id,
        name: p.full_name,
        city: [p.city, p.state].filter(Boolean).join(', ') || '—',
        email: p.email ?? '—',
        phone: p.phone ?? '—',
        references: (p.reference_1 ? 1 : 0) + (p.reference_2 ? 1 : 0),
        dateApplied: new Date(p.created_at).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric',
        }),
      }))
    )

    // Approved: is_approved = true
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: approved } = await (supabase.from('shadchan_profiles') as any)
      .select('id, user_id, full_name, city, state, email, approved_at, approved_by_admin_id, created_by_admin_id')
      .eq('is_approved', true)
      .order('approved_at', { ascending: false }) as {
        data: Array<{
          id: string
          user_id: string
          full_name: string
          city: string | null
          state: string | null
          email: string | null
          approved_at: string | null
          approved_by_admin_id: string | null
          created_by_admin_id: string | null
        }> | null
      }

    // Load user statuses for approved shadchanim
    const approvedUserIds = (approved ?? []).map((a) => a.user_id)
    let userStatuses: Record<string, string> = {}
    if (approvedUserIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: userRows } = await (supabase.from('users') as any)
        .select('id, status')
        .in('id', approvedUserIds) as { data: Array<{ id: string; status: string }> | null }
      userStatuses = Object.fromEntries((userRows ?? []).map((u) => [u.id, u.status]))
    }

    // Resolve admin names for approved_by_admin_id and created_by_admin_id
    const adminIdSet = new Set<string>()
    for (const a of approved ?? []) {
      if (a.approved_by_admin_id) adminIdSet.add(a.approved_by_admin_id)
      if (a.created_by_admin_id) adminIdSet.add(a.created_by_admin_id)
    }
    const adminEmailMap: Record<string, string> = {}
    if (adminIdSet.size > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: adminRows } = await (supabase.from('users') as any)
        .select('id, email')
        .in('id', Array.from(adminIdSet)) as { data: Array<{ id: string; email: string | null }> | null }
      for (const r of adminRows ?? []) adminEmailMap[r.id] = r.email ?? r.id
    }

    setApprovedList(
      (approved ?? []).map((a) => ({
        id: a.id,
        name: a.full_name,
        city: [a.city, a.state].filter(Boolean).join(', ') || '—',
        email: a.email ?? '—',
        approvedDate: a.approved_at
          ? new Date(a.approved_at).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
            })
          : '—',
        status: userStatuses[a.user_id] ?? 'active',
        matchesMade: 0,
        singlesManaged: 0,
        addedBy: a.created_by_admin_id ? (adminEmailMap[a.created_by_admin_id] ?? '—') : 'Self-registered',
        approvedBy: a.approved_by_admin_id ? (adminEmailMap[a.approved_by_admin_id] ?? '—') : '—',
      }))
    )

    setLoading(false)
  }

  async function handleApprove(id: string) {
    setActionLoading(true)
    setActionError('')
    try {
      const res = await fetch(`/api/admin/shadchanim/${id}/approve`, { method: 'POST' })
      if (!res.ok) {
        const json = await res.json()
        setActionError(json.error ?? 'Approval failed. Please try again.')
        return
      }
      // Move from pending to approved in local state
      const shadchan = pendingList.find((s) => s.id === id)
      if (shadchan) {
        setPendingList((prev) => prev.filter((s) => s.id !== id))
        setApprovedList((prev) => [
          {
            id: shadchan.id,
            name: shadchan.name,
            city: shadchan.city,
            email: shadchan.email,
            approvedDate: new Date().toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
            }),
            status: 'active',
            matchesMade: 0,
            singlesManaged: 0,
            addedBy: 'Self-registered',
            approvedBy: 'You',
          },
          ...prev,
        ])
      }
      setConfirmId(null)
    } catch {
      setActionError('Network error. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleReject(id: string) {
    setActionLoading(true)
    setActionError('')
    try {
      const res = await fetch(`/api/admin/shadchanim/${id}/reject`, { method: 'POST' })
      if (!res.ok) {
        const json = await res.json()
        setActionError(json.error ?? 'Rejection failed. Please try again.')
        return
      }
      setPendingList((prev) => prev.filter((s) => s.id !== id))
    } catch {
      setActionError('Network error. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  const pendingFiltered = pendingList.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.city.toLowerCase().includes(search.toLowerCase())
  )

  const allFiltered = approvedList.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.city.toLowerCase().includes(search.toLowerCase())
  )

  const confirmingName = pendingList.find((s) => s.id === confirmId)?.name ?? ''

  return (
    <AppLayout navItems={navItems} title="Shadchanim" role="platform_admin">
      {/* Header with Add button */}
      <div className="flex justify-end mb-4">
        <Button className="gap-2" onClick={() => setAddOpen(true)}>
          <UserPlus className="h-4 w-4" />
          Add Shadchan
        </Button>
      </div>

      {actionError && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'pending'
              ? 'border-brand-pink text-brand-pink'
              : 'border-transparent text-[#888888] hover:text-[#555555]'
          }`}
          onClick={() => setTab('pending')}
        >
          Pending Approval
          {pendingList.length > 0 && (
            <span className="ml-2 bg-red-100 text-red-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
              {pendingList.length}
            </span>
          )}
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'all'
              ? 'border-brand-pink text-brand-pink'
              : 'border-transparent text-[#888888] hover:text-[#555555]'
          }`}
          onClick={() => setTab('all')}
        >
          All Shadchanim
          <span className="ml-2 bg-gray-100 text-gray-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
            {approvedList.length}
          </span>
        </button>
      </div>

      <div className="card">
        {/* Search */}
        <div className="relative mb-4 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#888888]" />
          <Input
            placeholder="Search shadchanim..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-[#888888] text-sm">
            Loading…
          </div>
        ) : tab === 'pending' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="table-th">Name</th>
                  <th className="table-th">City</th>
                  <th className="table-th">Email</th>
                  <th className="table-th">Phone</th>
                  <th className="table-th">References</th>
                  <th className="table-th">Date Applied</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingFiltered.map((s) => (
                  <tr key={s.id} className="table-row">
                    <td className="table-td font-medium text-[#1A1A1A]">{s.name}</td>
                    <td className="table-td text-[#555555]">{s.city}</td>
                    <td className="table-td text-[#555555]">{s.email}</td>
                    <td className="table-td text-[#555555]">{s.phone}</td>
                    <td className="table-td text-[#555555]">{s.references}</td>
                    <td className="table-td text-[#555555]">{s.dateApplied}</td>
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className="gap-1 bg-green-600 hover:bg-green-700 text-white border-green-600"
                          disabled={actionLoading}
                          onClick={() => setConfirmId(s.id)}
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          Approve
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          className="gap-1"
                          disabled={actionLoading}
                          onClick={() => handleReject(s.id)}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {pendingFiltered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="table-td text-center text-[#888888] py-8">
                      No pending approvals.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="table-th">Name</th>
                  <th className="table-th">City</th>
                  <th className="table-th">Email</th>
                  <th className="table-th">Approved Date</th>
                  <th className="table-th">Added By</th>
                  <th className="table-th">Approved By</th>
                  <th className="table-th">Matches Made</th>
                  <th className="table-th">Singles Managed</th>
                  <th className="table-th">Status</th>
                </tr>
              </thead>
              <tbody>
                {allFiltered.map((s) => (
                  <tr key={s.id} className="table-row">
                    <td className="table-td font-medium text-[#1A1A1A]">{s.name}</td>
                    <td className="table-td text-[#555555]">{s.city}</td>
                    <td className="table-td text-[#555555]">{s.email}</td>
                    <td className="table-td text-[#555555]">{s.approvedDate}</td>
                    <td className="table-td text-[#555555] text-xs">{s.addedBy}</td>
                    <td className="table-td text-[#555555] text-xs">{s.approvedBy}</td>
                    <td className="table-td text-center">
                      <span className="font-semibold text-[#1A1A1A]">{s.matchesMade}</span>
                    </td>
                    <td className="table-td text-center">
                      <span className="font-semibold text-[#1A1A1A]">{s.singlesManaged}</span>
                    </td>
                    <td className="table-td">
                      <StatusBadge status={s.status} />
                    </td>
                  </tr>
                ))}
                {allFiltered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="table-td text-center text-[#888888] py-8">
                      No approved shadchanim yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Approve Confirmation Dialog */}
      <Dialog open={confirmId !== null} onOpenChange={(open) => { if (!open) setConfirmId(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Shadchan</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-2">
            <p className="text-sm text-[#555555]">
              Are you sure you want to approve{' '}
              <span className="font-semibold text-[#1A1A1A]">{confirmingName}</span> as a shadchan?
              They will gain full access to the platform.
            </p>
          </div>
          <DialogFooter>
            <Button variant="secondary" size="md" onClick={() => setConfirmId(null)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              disabled={actionLoading}
              onClick={() => confirmId && handleApprove(confirmId)}
            >
              {actionLoading ? 'Approving…' : 'Confirm Approval'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddShadchanModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={(id, name) => {
          setApprovedList((prev) => [
            {
              id,
              name,
              city: '—',
              email: '—',
              approvedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              status: 'active',
              matchesMade: 0,
              singlesManaged: 0,
              addedBy: 'You',
              approvedBy: 'You',
            },
            ...prev,
          ])
          setTab('all')
        }}
      />
    </AppLayout>
  )
}
