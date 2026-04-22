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
  ShieldOff,
  ShieldCheck,
  UserPlus,
  UsersRound,
  Home,
  BookOpen,
  MessageSquare,
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { StatCard } from '@/components/ui/stat-card'
import { StatusBadge, RoleBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Pagination } from '@/components/ui/pagination'
import { AddUserModal } from '@/components/admin/add-user-modal'
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

interface UserRow {
  id: string
  email: string | null
  phone: string | null
  role: string
  status: string
  created_at: string
}

export default function AdminUsersPage() {
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<UserRow[]>([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const pageSize = 10

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: rows } = await (supabase.from('users') as any)
        .select('id, email, phone, role, status, created_at')
        .order('created_at', { ascending: false }) as { data: UserRow[] | null }

      setUsers(rows ?? [])
      setLoading(false)
    }

    load()
  }, [])

  const filtered = users.filter((u) => {
    const matchSearch =
      (u.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
      u.id.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    const matchStatus = statusFilter === 'all' || u.status === statusFilter
    return matchSearch && matchRole && matchStatus
  })

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  const totalCount = users.length
  const activeCount = users.filter((u) => u.status === 'active').length
  const pendingCount = users.filter((u) => u.status === 'pending').length
  const suspendedCount = users.filter((u) => u.status === 'suspended').length

  async function handleStatusChange(userId: string, newStatus: string) {
    setActionLoading(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
        )
      }
    } catch { /* ignore */ } finally {
      setActionLoading(null)
    }
  }

  return (
    <AppLayout navItems={navItems} title="Users" role="platform_admin">
      <div className="flex justify-end mb-4">
        <Button className="gap-2" onClick={() => setAddUserOpen(true)}>
          <UserPlus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={totalCount} icon={Users} />
        <StatCard label="Active" value={activeCount} icon={ShieldCheck} />
        <StatCard label="Pending" value={pendingCount} icon={UserCheck} />
        <StatCard label="Suspended" value={suspendedCount} icon={ShieldOff} />
      </div>

      <div className="card mt-6">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-[#888888] text-sm">Loading…</div>
        ) : (
          <>
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#888888]" />
                <Input
                  placeholder="Search by email or user ID..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                />
              </div>
              <select
                className="input-base min-w-[140px]"
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}
              >
                <option value="all">All Roles</option>
                <option value="platform_admin">Admin</option>
                <option value="shadchan">Shadchan</option>
                <option value="single">Single</option>
                <option value="parent">Parent</option>
                <option value="advocate">Advocate</option>
                <option value="maschil">Maschil</option>
              </select>
              <select
                className="input-base min-w-[140px]"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="table-th">User ID</th>
                    <th className="table-th">Email / Phone</th>
                    <th className="table-th">Role</th>
                    <th className="table-th">Status</th>
                    <th className="table-th">Created</th>
                    <th className="table-th">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((user) => (
                    <tr key={user.id} className="table-row">
                      <td className="table-td font-mono text-xs text-[#888888]">
                        {user.id.slice(0, 14)}…
                      </td>
                      <td className="table-td text-[#1A1A1A]">
                        {user.email ?? user.phone ?? '—'}
                      </td>
                      <td className="table-td">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="table-td">
                        <StatusBadge status={user.status} />
                      </td>
                      <td className="table-td text-[#555555]">
                        {new Date(user.created_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </td>
                      <td className="table-td">
                        <div className="flex items-center gap-1">
                          {user.status === 'suspended' ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              className="gap-1"
                              disabled={actionLoading === user.id}
                              onClick={() => handleStatusChange(user.id, 'active')}
                            >
                              <ShieldCheck className="h-3.5 w-3.5" />
                              Activate
                            </Button>
                          ) : user.status !== 'suspended' ? (
                            <Button
                              variant="danger"
                              size="sm"
                              className="gap-1"
                              disabled={actionLoading === user.id}
                              onClick={() => handleStatusChange(user.id, 'suspended')}
                            >
                              <ShieldOff className="h-3.5 w-3.5" />
                              Suspend
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginated.length === 0 && (
                    <tr>
                      <td colSpan={6} className="table-td text-center text-[#888888] py-8">
                        {users.length === 0 ? 'No users found.' : 'No users match your search.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              total={filtered.length}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      <AddUserModal
        open={addUserOpen}
        onClose={() => setAddUserOpen(false)}
      />
    </AppLayout>
  )
}
