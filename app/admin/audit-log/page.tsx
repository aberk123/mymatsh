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
  UsersRound,
  Home,
  BookOpen,
  MessageSquare,
  PackageOpen,
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

const actionTypeColors: Record<string, string> = {
  approved_shadchan: 'bg-green-100 text-green-700',
  rejected_shadchan: 'bg-red-100 text-red-700',
  suspended_user: 'bg-red-100 text-red-700',
  activated_user: 'bg-green-100 text-green-700',
  added_organization: 'bg-blue-100 text-blue-700',
  deleted_news: 'bg-red-100 text-red-700',
  created_news: 'bg-blue-100 text-blue-700',
  approved_advocate: 'bg-green-100 text-green-700',
  updated_donation: 'bg-yellow-100 text-yellow-700',
  approved_maschil: 'bg-green-100 text-green-700',
  rejected_maschil: 'bg-red-100 text-red-700',
}

interface LogRow {
  id: string
  admin_id: string
  action: string
  target_type: string
  target_id: string
  metadata: Record<string, unknown> | null
  created_at: string
  adminEmail: string
}

export default function AdminAuditLogPage() {
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<LogRow[]>([])
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [adminFilter, setAdminFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: rows } = await (supabase.from('admin_audit_log') as any)
        .select('id, admin_id, action, target_type, target_id, metadata, created_at')
        .order('created_at', { ascending: false })
        .limit(200) as {
          data: Array<{
            id: string
            admin_id: string
            action: string
            target_type: string
            target_id: string
            metadata: Record<string, unknown> | null
            created_at: string
          }> | null
        }

      if (!rows || rows.length === 0) { setLoading(false); return }

      // Resolve admin emails
      const adminIds = Array.from(new Set(rows.map((r) => r.admin_id)))
      const emailMap: Record<string, string> = {}
      for (const adminId of adminIds) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: u } = await (supabase.from('users') as any)
          .select('email')
          .eq('id', adminId)
          .maybeSingle() as { data: { email: string | null } | null }
        emailMap[adminId] = u?.email ?? adminId.slice(0, 8) + '…'
      }

      setLogs(rows.map((r) => ({ ...r, adminEmail: emailMap[r.admin_id] ?? r.admin_id })))
      setLoading(false)
    }
    load()
  }, [])

  const filtered = logs.filter((log) => {
    const matchAdmin = adminFilter === '' || log.adminEmail.toLowerCase().includes(adminFilter.toLowerCase())
    const matchAction = actionFilter === '' || log.action.toLowerCase().includes(actionFilter.toLowerCase())
    const logDate = new Date(log.created_at)
    const matchFrom = dateFrom === '' || logDate >= new Date(dateFrom)
    const matchTo = dateTo === '' || logDate <= new Date(dateTo + 'T23:59:59')
    return matchAdmin && matchAction && matchFrom && matchTo
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
            <Label className="field-label">Action</Label>
            <Input
              placeholder="Filter by action..."
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-[#888888] text-sm">Loading…</div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-[#555555]">
                Showing {filtered.length} of {logs.length} entries
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
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((log) => (
                    <tr key={log.id} className="table-row">
                      <td className="table-td text-[#555555] whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                          hour: 'numeric', minute: '2-digit',
                        })}
                      </td>
                      <td className="table-td text-[#555555] text-xs">{log.adminEmail}</td>
                      <td className="table-td">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${
                            actionTypeColors[log.action] ?? 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="table-td text-[#555555] text-xs">{log.target_type}</td>
                      <td className="table-td font-mono text-xs text-[#888888]">
                        {log.target_id.length > 16 ? log.target_id.slice(0, 14) + '…' : log.target_id}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="table-td text-center text-[#888888] py-8">
                        {logs.length === 0 ? 'No audit log entries yet.' : 'No entries match your filters.'}
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
