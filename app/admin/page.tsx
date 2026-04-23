'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
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
  ChevronRight,
  UsersRound,
  Home,
  BookOpen,
  MessageSquare,
  PackageOpen,
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { WelcomeBanner } from '@/components/ui/welcome-banner'
import { StatCard } from '@/components/ui/stat-card'
import { Button } from '@/components/ui/button'
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
  full_name: string
  city: string | null
  state: string | null
  email: string | null
  created_at: string
}

interface AuditEntry {
  id: string
  action: string
  target_type: string
  target_id: string
  created_at: string
}

export default function AdminDashboardPage() {
  const [totalUsers, setTotalUsers] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)
  const [activeSingles, setActiveSingles] = useState(0)
  const [orgCount, setOrgCount] = useState(0)
  const [pendingShadchanim, setPendingShadchanim] = useState<PendingShadchan[]>([])
  const [recentAudit, setRecentAudit] = useState<AuditEntry[]>([])
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count: users } = await (supabase.from('users') as any)
        .select('id', { count: 'exact', head: true }) as { count: number | null }
      setTotalUsers(users ?? 0)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: pending } = await (supabase.from('shadchan_profiles') as any)
        .select('id, full_name, city, state, email, created_at')
        .eq('is_approved', false)
        .order('created_at', { ascending: false })
        .limit(5) as { data: PendingShadchan[] | null }

      setPendingShadchanim(pending ?? [])
      setPendingCount((pending ?? []).length)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count: singles } = await (supabase.from('singles') as any)
        .select('id', { count: 'exact', head: true })
        .eq('status', 'available') as { count: number | null }
      setActiveSingles(singles ?? 0)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count: orgs } = await (supabase.from('organizations') as any)
        .select('id', { count: 'exact', head: true }) as { count: number | null }
      setOrgCount(orgs ?? 0)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: audit } = await (supabase.from('admin_audit_log') as any)
        .select('id, action, target_type, target_id, created_at')
        .order('created_at', { ascending: false })
        .limit(5) as { data: AuditEntry[] | null }
      setRecentAudit(audit ?? [])
    }
    load()
  }, [])

  async function handleApprove(id: string) {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/shadchanim/${id}/approve`, { method: 'POST' })
      if (res.ok) {
        setPendingShadchanim((prev) => prev.filter((s) => s.id !== id))
        setPendingCount((prev) => Math.max(prev - 1, 0))
      }
    } catch { /* ignore */ } finally {
      setActionLoading(false)
    }
  }

  async function handleReject(id: string) {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/shadchanim/${id}/reject`, { method: 'POST' })
      if (res.ok) {
        setPendingShadchanim((prev) => prev.filter((s) => s.id !== id))
        setPendingCount((prev) => Math.max(prev - 1, 0))
      }
    } catch { /* ignore */ } finally {
      setActionLoading(false)
    }
  }

  return (
    <AppLayout navItems={navItems} title="Admin Dashboard" role="platform_admin">
      <WelcomeBanner
        greeting="Welcome, Admin"
        subtitle="Platform overview and pending actions."
        steps={[
          { number: 1, label: 'Approve Shadchanim' },
          { number: 2, label: 'Manage Users' },
          { number: 3, label: 'Monitor Platform' },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
        <StatCard label="Total Users" value={totalUsers} icon={Users} />
        <StatCard
          label="Pending Approvals"
          value={pendingCount}
          icon={UserCheck}
          onClick={() => window.location.assign('/admin/shadchanim')}
        />
        <StatCard label="Active Singles" value={activeSingles} icon={Heart} />
        <StatCard label="Organizations" value={orgCount} icon={Building2} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
        <div className="xl:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#1A1A1A]">Pending Shadchan Approvals</h3>
            <Link href="/admin/shadchanim">
              <Button variant="ghost" size="sm" className="gap-1 text-brand-maroon">
                View All <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
          {pendingShadchanim.length === 0 ? (
            <p className="text-sm text-[#888888] py-4 text-center">No pending approvals.</p>
          ) : (
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
                  {pendingShadchanim.map((s) => (
                    <tr key={s.id} className="table-row">
                      <td className="table-td font-medium text-[#1A1A1A]">{s.full_name}</td>
                      <td className="table-td text-[#555555]">{[s.city, s.state].filter(Boolean).join(', ') || '—'}</td>
                      <td className="table-td text-[#555555]">{s.email ?? '—'}</td>
                      <td className="table-td text-[#555555]">
                        {new Date(s.created_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </td>
                      <td className="table-td">
                        <div className="flex items-center gap-2">
                          <Button variant="primary" size="sm" className="gap-1" disabled={actionLoading} onClick={() => handleApprove(s.id)}>
                            <CheckCircle className="h-3.5 w-3.5" />
                            Approve
                          </Button>
                          <Button variant="danger" size="sm" className="gap-1" disabled={actionLoading} onClick={() => handleReject(s.id)}>
                            <XCircle className="h-3.5 w-3.5" />
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#1A1A1A]">Recent Activity</h3>
            <Link href="/admin/audit-log">
              <Button variant="ghost" size="sm" className="gap-1 text-brand-maroon">
                View All <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
          {recentAudit.length === 0 ? (
            <p className="text-sm text-[#888888] py-4 text-center">No activity yet.</p>
          ) : (
            <div className="space-y-3">
              {recentAudit.map((entry) => (
                <div key={entry.id} className="p-3 rounded-lg bg-[#FAFAFA] border border-gray-100">
                  <p className="text-sm font-medium text-[#1A1A1A]">{entry.action}</p>
                  <p className="text-xs text-[#555555] mt-0.5">
                    {entry.target_type}: {entry.target_id.slice(0, 8)}…
                  </p>
                  <p className="text-xs text-[#888888] mt-0.5">
                    {new Date(entry.created_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric',
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
