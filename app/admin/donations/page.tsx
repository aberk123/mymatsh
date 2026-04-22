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
  RefreshCw,
  CreditCard,
  UsersRound,
  Home,
  BookOpen,
  MessageSquare,
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { StatCard } from '@/components/ui/stat-card'
import { StatusBadge } from '@/components/ui/badge'
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

const mockPayments = [
  { id: '1', user: 'Yosef Goldstein', email: 'y.goldstein@example.com', type: 'recurring', amount: 36.00, status: 'completed', date: 'Apr 21, 2026' },
  { id: '2', user: 'Rivka Cohen', email: 'r.cohen@example.com', type: 'one_time', amount: 180.00, status: 'completed', date: 'Apr 20, 2026' },
  { id: '3', user: 'Moshe Greenberg', email: 'm.greenberg@example.com', type: 'recurring', amount: 54.00, status: 'pending', date: 'Apr 20, 2026' },
  { id: '4', user: 'Devorah Weiss', email: 'd.weiss@example.com', type: 'one_time', amount: 360.00, status: 'completed', date: 'Apr 19, 2026' },
  { id: '5', user: 'Avraham Katz', email: 'a.katz@example.com', type: 'recurring', amount: 18.00, status: 'failed', date: 'Apr 18, 2026' },
  { id: '6', user: 'Chana Stern', email: 'c.stern@example.com', type: 'one_time', amount: 250.00, status: 'completed', date: 'Apr 17, 2026' },
  { id: '7', user: 'Shmuel Blum', email: 's.blum@example.com', type: 'recurring', amount: 72.00, status: 'completed', date: 'Apr 16, 2026' },
  { id: '8', user: 'Nechama Rubin', email: 'n.rubin@example.com', type: 'one_time', amount: 500.00, status: 'pending', date: 'Apr 15, 2026' },
  { id: '9', user: 'Pinchas Horowitz', email: 'p.horowitz@example.com', type: 'recurring', amount: 36.00, status: 'completed', date: 'Apr 14, 2026' },
  { id: '10', user: 'Leah Friedman', email: 'l.friedman@example.com', type: 'one_time', amount: 100.00, status: 'completed', date: 'Apr 13, 2026' },
]

const statusMap: Record<string, string> = {
  completed: 'completed',
  pending: 'pending',
  failed: 'inactive',
}

export default function AdminDonationsPage() {
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = mockPayments.filter((p) => {
    const matchType = typeFilter === 'all' || p.type === typeFilter
    const matchStatus = statusFilter === 'all' || p.status === statusFilter
    return matchType && matchStatus
  })

  return (
    <AppLayout navItems={navItems} title="Donations" role="platform_admin">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Collected" value="$24,500" icon={DollarSign} />
        <StatCard label="Recurring / mo" value="$8,200" icon={RefreshCw} />
        <StatCard label="One-time" value="$16,300" icon={CreditCard} />
        <StatCard label="Pending" value="$1,200" icon={DollarSign} />
      </div>

      {/* Filters + Table */}
      <div className="card mt-6">
        <div className="flex flex-wrap gap-3 mb-4">
          <select
            className="input-base min-w-[160px]"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="recurring">Recurring</option>
            <option value="one_time">One-time</option>
          </select>
          <select
            className="input-base min-w-[160px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="table-th">User</th>
                <th className="table-th">Email</th>
                <th className="table-th">Type</th>
                <th className="table-th">Amount</th>
                <th className="table-th">Status</th>
                <th className="table-th">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((payment) => (
                <tr key={payment.id} className="table-row">
                  <td className="table-td font-medium text-[#1A1A1A]">{payment.user}</td>
                  <td className="table-td text-[#555555] text-xs">{payment.email}</td>
                  <td className="table-td">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        payment.type === 'recurring'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {payment.type === 'recurring' ? 'Recurring' : 'One-time'}
                    </span>
                  </td>
                  <td className="table-td font-medium text-[#1A1A1A]">
                    ${payment.amount.toFixed(2)}
                  </td>
                  <td className="table-td">
                    <StatusBadge status={statusMap[payment.status] ?? 'pending'} />
                  </td>
                  <td className="table-td text-[#555555]">{payment.date}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="table-td text-center text-[#888888] py-8">
                    No payment records match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  )
}
