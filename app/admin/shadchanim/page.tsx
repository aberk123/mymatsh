'use client'

import { useState } from 'react'
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
import type { NavItem } from '@/components/ui/sidebar'

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Shadchanim', href: '/admin/shadchanim', icon: UserCheck, badge: '4' },
  { label: 'Organizations', href: '/admin/organizations', icon: Building2 },
  { label: 'Advocates', href: '/admin/advocates', icon: Heart },
  { label: 'News', href: '/admin/news', icon: Newspaper },
  { label: 'Donations', href: '/admin/donations', icon: DollarSign },
  { label: 'Audit Log', href: '/admin/audit-log', icon: ClipboardList },
]

const pendingShadchanim = [
  { id: '1', name: 'Miriam Horowitz', city: 'Lakewood, NJ', email: 'miriam.h@example.com', phone: '(732) 555-0101', references: 2, dateApplied: 'Apr 18, 2026' },
  { id: '2', name: 'Yehuda Rosenberg', city: 'Brooklyn, NY', email: 'y.rosenberg@example.com', phone: '(718) 555-0202', references: 3, dateApplied: 'Apr 17, 2026' },
  { id: '3', name: 'Chana Feldman', city: 'Monsey, NY', email: 'chana.f@example.com', phone: '(845) 555-0303', references: 1, dateApplied: 'Apr 15, 2026' },
  { id: '4', name: 'Avigail Stern', city: 'Baltimore, MD', email: 'avigail.s@example.com', phone: '(410) 555-0404', references: 4, dateApplied: 'Apr 12, 2026' },
]

const allShadchanim = [
  { id: '5', name: 'Rivka Klein', city: 'Brooklyn, NY', email: 'rivka.k@example.com', phone: '(718) 555-0505', references: 5, approvedDate: 'Mar 10, 2026', status: 'active' },
  { id: '6', name: 'Moshe Greenberg', city: 'Lakewood, NJ', email: 'm.greenberg@example.com', phone: '(732) 555-0606', references: 3, approvedDate: 'Mar 5, 2026', status: 'active' },
  { id: '7', name: 'Devorah Levi', city: 'Chicago, IL', email: 'd.levi@example.com', phone: '(312) 555-0707', references: 2, approvedDate: 'Feb 28, 2026', status: 'active' },
  { id: '8', name: 'Avraham Katz', city: 'Monsey, NY', email: 'a.katz@example.com', phone: '(845) 555-0808', references: 6, approvedDate: 'Feb 20, 2026', status: 'active' },
  { id: '9', name: 'Leah Blum', city: 'Passaic, NJ', email: 'l.blum@example.com', phone: '(973) 555-0909', references: 4, approvedDate: 'Feb 15, 2026', status: 'active' },
  { id: '10', name: 'Shmuel Weiss', city: 'Baltimore, MD', email: 's.weiss@example.com', phone: '(410) 555-1010', references: 3, approvedDate: 'Jan 30, 2026', status: 'active' },
  { id: '11', name: 'Nechama Cohen', city: 'Teaneck, NJ', email: 'n.cohen@example.com', phone: '(201) 555-1111', references: 5, approvedDate: 'Jan 22, 2026', status: 'active' },
  { id: '12', name: 'Pinchas Rubin', city: 'Lawrence, NY', email: 'p.rubin@example.com', phone: '(516) 555-1212', references: 2, approvedDate: 'Jan 15, 2026', status: 'inactive' },
]

export default function AdminShadchanimPage() {
  const [tab, setTab] = useState<'pending' | 'all'>('pending')
  const [search, setSearch] = useState('')
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [pendingList, setPendingList] = useState(pendingShadchanim)

  const pendingFiltered = pendingList.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.city.toLowerCase().includes(search.toLowerCase())
  )

  const allFiltered = allShadchanim.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.city.toLowerCase().includes(search.toLowerCase())
  )

  const handleApprove = (id: string) => {
    setPendingList((prev) => prev.filter((s) => s.id !== id))
    setConfirmId(null)
  }

  const handleReject = (id: string) => {
    setPendingList((prev) => prev.filter((s) => s.id !== id))
  }

  const confirmingName = pendingList.find((s) => s.id === confirmId)?.name ?? ''

  return (
    <AppLayout navItems={navItems} title="Shadchanim" role="platform_admin">
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
          <span className="ml-2 bg-red-100 text-red-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
            {pendingList.length}
          </span>
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
            {allShadchanim.length}
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

        {tab === 'pending' ? (
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
                          variant="primary"
                          size="sm"
                          className="gap-1"
                          onClick={() => setConfirmId(s.id)}
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          Approve
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          className="gap-1"
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
                  <th className="table-th">Phone</th>
                  <th className="table-th">References</th>
                  <th className="table-th">Approved Date</th>
                  <th className="table-th">Status</th>
                </tr>
              </thead>
              <tbody>
                {allFiltered.map((s) => (
                  <tr key={s.id} className="table-row">
                    <td className="table-td font-medium text-[#1A1A1A]">{s.name}</td>
                    <td className="table-td text-[#555555]">{s.city}</td>
                    <td className="table-td text-[#555555]">{s.email}</td>
                    <td className="table-td text-[#555555]">{s.phone}</td>
                    <td className="table-td text-[#555555]">{s.references}</td>
                    <td className="table-td text-[#555555]">{s.approvedDate}</td>
                    <td className="table-td">
                      <StatusBadge status={s.status} />
                    </td>
                  </tr>
                ))}
                {allFiltered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="table-td text-center text-[#888888] py-8">
                      No shadchanim found.
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
              Are you sure you want to approve <span className="font-semibold text-[#1A1A1A]">{confirmingName}</span> as a shadchan? They will gain full access to the platform.
            </p>
          </div>
          <DialogFooter>
            <Button variant="secondary" size="md" onClick={() => setConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => confirmId && handleApprove(confirmId)}
            >
              Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
