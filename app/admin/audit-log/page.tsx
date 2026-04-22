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
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

const actionTypes = [
  'All Actions',
  'Approved Shadchan',
  'Rejected Shadchan',
  'Suspended User',
  'Activated User',
  'Added Organization',
  'Deleted News Article',
  'Created News Article',
  'Approved Advocate',
  'Updated Donation',
]

const mockLogs = [
  { id: '1', timestamp: 'Apr 21, 2026 09:14', admin: 'admin@mymatsh.com', action: 'Approved Shadchan', targetType: 'shadchan_profile', targetId: 'shd_a1b2c3d4e5f6', details: 'Shadchan Miriam Horowitz approved after review.' },
  { id: '2', timestamp: 'Apr 21, 2026 08:52', admin: 'admin@mymatsh.com', action: 'Suspended User', targetType: 'user', targetId: 'usr_f6g7h8i9j012', details: 'User suspended due to policy violation.' },
  { id: '3', timestamp: 'Apr 20, 2026 17:30', admin: 'admin@mymatsh.com', action: 'Rejected Shadchan', targetType: 'shadchan_profile', targetId: 'shd_b2c3d4e5f6g7', details: 'Application rejected — insufficient references.' },
  { id: '4', timestamp: 'Apr 20, 2026 15:10', admin: 'admin@mymatsh.com', action: 'Created News Article', targetType: 'news_article', targetId: 'art_c3d4e5f6g7h8', details: 'Published: MyMatSH Spring 2026 Platform Update.' },
  { id: '5', timestamp: 'Apr 19, 2026 11:05', admin: 'admin@mymatsh.com', action: 'Approved Advocate', targetType: 'advocate', targetId: 'adv_d4e5f6g7h8i9', details: 'Advocate Devorah Blum approved.' },
  { id: '6', timestamp: 'Apr 18, 2026 14:22', admin: 'admin@mymatsh.com', action: 'Added Organization', targetType: 'organization', targetId: 'org_e5f6g7h8i9j0', details: "Organization Yad L'Bachur added to platform." },
  { id: '7', timestamp: 'Apr 17, 2026 10:45', admin: 'admin@mymatsh.com', action: 'Activated User', targetType: 'user', targetId: 'usr_f6g7h8i9j011', details: 'User account reactivated after review.' },
  { id: '8', timestamp: 'Apr 16, 2026 16:58', admin: 'admin@mymatsh.com', action: 'Deleted News Article', targetType: 'news_article', targetId: 'art_g7h8i9j0k1l2', details: 'Deleted outdated article: January Maintenance.' },
  { id: '9', timestamp: 'Apr 15, 2026 09:30', admin: 'admin@mymatsh.com', action: 'Approved Shadchan', targetType: 'shadchan_profile', targetId: 'shd_h8i9j0k1l2m3', details: 'Shadchan Avraham Katz approved.' },
  { id: '10', timestamp: 'Apr 14, 2026 13:17', admin: 'admin@mymatsh.com', action: 'Updated Donation', targetType: 'payment', targetId: 'pay_i9j0k1l2m3n4', details: 'Donation record corrected for user.' },
  { id: '11', timestamp: 'Apr 13, 2026 11:00', admin: 'admin@mymatsh.com', action: 'Rejected Shadchan', targetType: 'shadchan_profile', targetId: 'shd_j0k1l2m3n4o5', details: 'Rejected — duplicate account detected.' },
  { id: '12', timestamp: 'Apr 12, 2026 08:45', admin: 'admin@mymatsh.com', action: 'Added Organization', targetType: 'organization', targetId: 'org_k1l2m3n4o5p6', details: 'Organization Binyan Bayit Society added.' },
  { id: '13', timestamp: 'Apr 11, 2026 14:30', admin: 'admin@mymatsh.com', action: 'Approved Advocate', targetType: 'advocate', targetId: 'adv_l2m3n4o5p6q7', details: 'Advocate Shaina Goldberg approved.' },
  { id: '14', timestamp: 'Apr 10, 2026 10:15', admin: 'admin@mymatsh.com', action: 'Suspended User', targetType: 'user', targetId: 'usr_m3n4o5p6q7r8', details: 'User suspended — spam reports received.' },
  { id: '15', timestamp: 'Apr 9, 2026 09:00', admin: 'admin@mymatsh.com', action: 'Created News Article', targetType: 'news_article', targetId: 'art_n4o5p6q7r8s9', details: 'Published: New Shadchan Certification Program.' },
]

const actionTypeColors: Record<string, string> = {
  'Approved Shadchan': 'bg-green-100 text-green-700',
  'Rejected Shadchan': 'bg-red-100 text-red-700',
  'Suspended User': 'bg-red-100 text-red-700',
  'Activated User': 'bg-green-100 text-green-700',
  'Added Organization': 'bg-blue-100 text-blue-700',
  'Deleted News Article': 'bg-red-100 text-red-700',
  'Created News Article': 'bg-blue-100 text-blue-700',
  'Approved Advocate': 'bg-green-100 text-green-700',
  'Updated Donation': 'bg-yellow-100 text-yellow-700',
}

export default function AdminAuditLogPage() {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [adminFilter, setAdminFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('All Actions')

  const filtered = mockLogs.filter((log) => {
    const matchAdmin = adminFilter === '' || log.admin.toLowerCase().includes(adminFilter.toLowerCase())
    const matchAction = actionFilter === 'All Actions' || log.action === actionFilter
    return matchAdmin && matchAction
  })

  return (
    <AppLayout navItems={navItems} title="Audit Log" role="platform_admin">
      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col gap-1 min-w-[140px]">
            <Label className="field-label">From Date</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="min-w-[140px]"
            />
          </div>
          <div className="flex flex-col gap-1 min-w-[140px]">
            <Label className="field-label">To Date</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="min-w-[140px]"
            />
          </div>
          <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
            <Label className="field-label">Admin User</Label>
            <Input
              placeholder="Filter by admin email..."
              value={adminFilter}
              onChange={(e) => setAdminFilter(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1 min-w-[180px]">
            <Label className="field-label">Action Type</Label>
            <select
              className="input-base"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              {actionTypes.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-[#555555]">
            Showing {filtered.length} of {mockLogs.length} entries
          </p>
          <span className="text-xs text-[#888888] italic">Read-only — audit log cannot be modified</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="table-th">Timestamp</th>
                <th className="table-th">Admin</th>
                <th className="table-th">Action</th>
                <th className="table-th">Target Type</th>
                <th className="table-th">Target ID</th>
                <th className="table-th">Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <tr key={log.id} className="table-row">
                  <td className="table-td text-[#555555] whitespace-nowrap">{log.timestamp}</td>
                  <td className="table-td text-[#555555] text-xs">{log.admin}</td>
                  <td className="table-td">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${
                        actionTypeColors[log.action] ?? 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="table-td text-[#555555] text-xs">{log.targetType}</td>
                  <td className="table-td font-mono text-xs text-[#888888]">
                    {log.targetId.slice(0, 16)}…
                  </td>
                  <td className="table-td text-[#555555] text-xs max-w-xs truncate">{log.details}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="table-td text-center text-[#888888] py-8">
                    No audit log entries match your filters.
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
