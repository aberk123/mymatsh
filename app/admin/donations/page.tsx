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

interface PaymentRow {
  id: string
  user_id: string
  type: 'recurring' | 'one_time'
  amount: number
  status: string
  payment_date: string
  created_at: string
  userEmail: string
}

const statusMap: Record<string, string> = {
  completed: 'completed',
  pending: 'pending',
  failed: 'inactive',
}

export default function AdminDonationsPage() {
  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState<PaymentRow[]>([])
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: rows } = await (supabase.from('donate_payments') as any)
        .select('id, user_id, type, amount, status, payment_date, created_at')
        .order('payment_date', { ascending: false }) as {
          data: Array<{
            id: string
            user_id: string
            type: 'recurring' | 'one_time'
            amount: number
            status: string
            payment_date: string
            created_at: string
          }> | null
        }

      if (!rows || rows.length === 0) { setLoading(false); return }

      // Resolve user emails
      const userIds = Array.from(new Set(rows.map((r) => r.user_id)))
      const emailMap: Record<string, string> = {}
      for (const uid of userIds) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: u } = await (supabase.from('users') as any)
          .select('email')
          .eq('id', uid)
          .maybeSingle() as { data: { email: string | null } | null }
        emailMap[uid] = u?.email ?? '—'
      }

      setPayments(rows.map((r) => ({ ...r, userEmail: emailMap[r.user_id] ?? '—' })))
      setLoading(false)
    }
    load()
  }, [])

  const filtered = payments.filter((p) => {
    const matchType = typeFilter === 'all' || p.type === typeFilter
    const matchStatus = statusFilter === 'all' || p.status === statusFilter
    return matchType && matchStatus
  })

  const totalCollected = payments
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0)
  const recurringTotal = payments
    .filter((p) => p.type === 'recurring' && p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0)
  const oneTimeTotal = payments
    .filter((p) => p.type === 'one_time' && p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0)
  const pendingTotal = payments
    .filter((p) => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0)

  const fmt = (n: number) =>
    '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

  return (
    <AppLayout navItems={navItems} title="Donations" role="platform_admin">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Collected" value={fmt(totalCollected)} icon={DollarSign} />
        <StatCard label="Recurring" value={fmt(recurringTotal)} icon={RefreshCw} />
        <StatCard label="One-time" value={fmt(oneTimeTotal)} icon={CreditCard} />
        <StatCard label="Pending" value={fmt(pendingTotal)} icon={DollarSign} />
      </div>

      <div className="card mt-6">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-[#888888] text-sm">Loading…</div>
        ) : (
          <>
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
                      <td className="table-td text-[#555555] text-xs">{payment.userEmail}</td>
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
                      <td className="table-td text-[#555555]">
                        {new Date(payment.payment_date).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="table-td text-center text-[#888888] py-8">
                        {payments.length === 0 ? 'No payment records found.' : 'No records match your filters.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}
