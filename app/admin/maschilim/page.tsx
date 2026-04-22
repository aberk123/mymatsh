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
  CheckCircle,
  XCircle,
  Eye,
  UsersRound,
  Home,
  BookOpen,
  MessageSquare,
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { NavItem } from '@/components/ui/sidebar'

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Shadchanim', href: '/admin/shadchanim', icon: UserCheck, badge: '4' },
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

const initialPending = [
  { id: '1', name: 'Yankel Grossman', city: 'Lakewood, NJ', email: 'y.grossman@example.com', dateApplied: 'Apr 19, 2026' },
  { id: '2', name: 'Tzippora Mandelbaum', city: 'Brooklyn, NY', email: 't.mandelbaum@example.com', dateApplied: 'Apr 16, 2026' },
]

const allMaschilim = [
  { id: '3', name: 'Pinchas Rubenstein', city: 'Monsey, NY', email: 'p.rubenstein@example.com', approvedDate: 'Mar 15, 2026', status: 'active' },
  { id: '4', name: 'Chana Berkowitz', city: 'Lakewood, NJ', email: 'c.berkowitz@example.com', approvedDate: 'Feb 28, 2026', status: 'active' },
  { id: '5', name: 'Moshe Lichtenstein', city: 'Chicago, IL', email: 'm.lichten@example.com', approvedDate: 'Feb 10, 2026', status: 'active' },
  { id: '6', name: 'Esther Shapiro', city: 'Baltimore, MD', email: 'e.shapiro@example.com', approvedDate: 'Jan 20, 2026', status: 'inactive' },
  { id: '7', name: 'Binyamin Kessler', city: 'Lawrence, NY', email: 'b.kessler@example.com', approvedDate: 'Jan 8, 2026', status: 'active' },
]

export default function AdminMaschilimPage() {
  const [tab, setTab] = useState<'pending' | 'all'>('pending')
  const [pendingList, setPendingList] = useState(initialPending)

  function handleApprove(id: string) {
    setPendingList((prev) => prev.filter((m) => m.id !== id))
  }

  function handleReject(id: string) {
    setPendingList((prev) => prev.filter((m) => m.id !== id))
  }

  return (
    <AppLayout navItems={navItems} title="Maschilim" role="platform_admin">
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
          Pending
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
          All Maschilim
          <span className="ml-2 bg-gray-100 text-gray-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
            {allMaschilim.length}
          </span>
        </button>
      </div>

      <div className="card">
        {tab === 'pending' ? (
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
                {pendingList.map((m) => (
                  <tr key={m.id} className="table-row">
                    <td className="table-td font-medium text-[#1A1A1A]">{m.name}</td>
                    <td className="table-td text-[#555555]">{m.city}</td>
                    <td className="table-td text-[#555555]">{m.email}</td>
                    <td className="table-td text-[#555555]">{m.dateApplied}</td>
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          className="gap-1"
                          onClick={() => handleApprove(m.id)}
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          Approve
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          className="gap-1"
                          onClick={() => handleReject(m.id)}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {pendingList.length === 0 && (
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
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {allMaschilim.map((m) => (
                  <tr key={m.id} className="table-row">
                    <td className="table-td font-medium text-[#1A1A1A]">{m.name}</td>
                    <td className="table-td text-[#555555]">{m.city}</td>
                    <td className="table-td text-[#555555]">{m.email}</td>
                    <td className="table-td text-[#555555]">{m.approvedDate}</td>
                    <td className="table-td">
                      <StatusBadge status={m.status} />
                    </td>
                    <td className="table-td">
                      <Button variant="ghost" size="sm" className="gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
