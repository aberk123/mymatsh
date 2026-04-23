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
  CheckCircle,
  XCircle,
  UsersRound,
  Home,
  BookOpen,
  MessageSquare,
  Search,
  PackageOpen,
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

interface Maschil {
  id: string
  user_id: string
  full_name: string
  city: string | null
  email: string | null
  is_approved: boolean
  created_at: string
}

export default function AdminMaschilimPage() {
  const [tab, setTab] = useState<'pending' | 'all'>('pending')
  const [loading, setLoading] = useState(true)
  const [pendingList, setPendingList] = useState<Maschil[]>([])
  const [approvedList, setApprovedList] = useState<Maschil[]>([])
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const supabase = createClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from('maschils') as any)
      .select('id, user_id, full_name, city, email, is_approved, created_at')
      .order('created_at', { ascending: false }) as { data: Maschil[] | null }

    const all = data ?? []
    setPendingList(all.filter((m) => !m.is_approved))
    setApprovedList(all.filter((m) => m.is_approved))
    setLoading(false)
  }

  async function handleApprove(id: string) {
    setActionLoading(true)
    setActionError('')
    try {
      const res = await fetch(`/api/admin/maschilim/${id}/approve`, { method: 'POST' })
      if (!res.ok) {
        const json = await res.json()
        setActionError(json.error ?? 'Approval failed.')
        return
      }
      const maschil = pendingList.find((m) => m.id === id)
      if (maschil) {
        setPendingList((prev) => prev.filter((m) => m.id !== id))
        setApprovedList((prev) => [{ ...maschil, is_approved: true }, ...prev])
      }
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
      const res = await fetch(`/api/admin/maschilim/${id}/reject`, { method: 'POST' })
      if (!res.ok) {
        const json = await res.json()
        setActionError(json.error ?? 'Rejection failed.')
        return
      }
      setPendingList((prev) => prev.filter((m) => m.id !== id))
    } catch {
      setActionError('Network error. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  const pendingFiltered = pendingList.filter(
    (m) =>
      m.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (m.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (m.city ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const allFiltered = approvedList.filter(
    (m) =>
      m.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (m.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (m.city ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AppLayout navItems={navItems} title="Maschilim" role="platform_admin">
      {actionError && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {actionError}
        </div>
      )}

      <div className="flex gap-1 border-b border-gray-200 mb-6">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'pending'
              ? 'border-brand-pink text-brand-pink'
              : 'border-transparent text-[#888888] hover:text-[#555555]'
          }`}
          onClick={() => setTab('pending')}
        >
          Pending
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
          All Maschilim
          <span className="ml-2 bg-gray-100 text-gray-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
            {approvedList.length}
          </span>
        </button>
      </div>

      <div className="card">
        <div className="relative mb-4 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#888888]" />
          <Input
            placeholder="Search maschilim..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-[#888888] text-sm">Loading…</div>
        ) : tab === 'pending' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="table-th">Name</th>
                  <th className="table-th">City</th>
                  <th className="table-th">Email</th>
                  <th className="table-th">Date Applied</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingFiltered.map((m) => (
                  <tr key={m.id} className="table-row">
                    <td className="table-td font-medium text-[#1A1A1A]">{m.full_name}</td>
                    <td className="table-td text-[#555555]">{m.city ?? '—'}</td>
                    <td className="table-td text-[#555555]">{m.email ?? '—'}</td>
                    <td className="table-td text-[#555555]">
                      {new Date(m.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </td>
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          className="gap-1"
                          disabled={actionLoading}
                          onClick={() => handleApprove(m.id)}
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          Approve
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          className="gap-1"
                          disabled={actionLoading}
                          onClick={() => handleReject(m.id)}
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
                    <td colSpan={5} className="table-td text-center text-[#888888] py-8">
                      No pending maschilim.
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
                  <th className="table-th">Status</th>
                </tr>
              </thead>
              <tbody>
                {allFiltered.map((m) => (
                  <tr key={m.id} className="table-row">
                    <td className="table-td font-medium text-[#1A1A1A]">{m.full_name}</td>
                    <td className="table-td text-[#555555]">{m.city ?? '—'}</td>
                    <td className="table-td text-[#555555]">{m.email ?? '—'}</td>
                    <td className="table-td text-[#555555]">
                      {new Date(m.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </td>
                    <td className="table-td"><StatusBadge status="active" /></td>
                  </tr>
                ))}
                {allFiltered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="table-td text-center text-[#888888] py-8">
                      No approved maschilim yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
