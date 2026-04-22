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
  Eye,
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

const mockUsers = [
  { id: 'usr_a1b2c3d4e5', email: 'miriam.cohen@example.com', role: 'shadchan', status: 'active', created: 'Jan 12, 2026' },
  { id: 'usr_f6g7h8i9j0', email: 'yosef.goldstein@example.com', role: 'single', status: 'active', created: 'Jan 15, 2026' },
  { id: 'usr_k1l2m3n4o5', email: 'devorah.weiss@example.com', role: 'single', status: 'active', created: 'Feb 2, 2026' },
  { id: 'usr_p6q7r8s9t0', email: 'reb.moshe@example.com', role: 'parent', status: 'active', created: 'Feb 10, 2026' },
  { id: 'usr_u1v2w3x4y5', email: 'chana.blum@example.com', role: 'advocate', status: 'active', created: 'Feb 18, 2026' },
  { id: 'usr_z6a7b8c9d0', email: 'shmuel.katz@example.com', role: 'maschil', status: 'pending', created: 'Mar 1, 2026' },
  { id: 'usr_e1f2g3h4i5', email: 'rivka.stern@example.com', role: 'single', status: 'pending', created: 'Mar 5, 2026' },
  { id: 'usr_j6k7l8m9n0', email: 'avraham.levy@example.com', role: 'shadchan', status: 'active', created: 'Mar 11, 2026' },
  { id: 'usr_o1p2q3r4s5', email: 'sarah.friedman@example.com', role: 'parent', status: 'suspended', created: 'Mar 20, 2026' },
  { id: 'usr_t6u7v8w9x0', email: 'menachem.rubin@example.com', role: 'single', status: 'active', created: 'Apr 1, 2026' },
  { id: 'usr_y1z2a3b4c5', email: 'leah.horowitz@example.com', role: 'advocate', status: 'suspended', created: 'Apr 5, 2026' },
  { id: 'usr_d6e7f8g9h0', email: 'admin@mymatsh.com', role: 'platform_admin', status: 'active', created: 'Jan 1, 2026' },
]

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [addUserOpen, setAddUserOpen] = useState(false)
  const pageSize = 10

  const filtered = mockUsers.filter((u) => {
    const matchSearch =
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.id.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    const matchStatus = statusFilter === 'all' || u.status === statusFilter
    return matchSearch && matchRole && matchStatus
  })

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <AppLayout navItems={navItems} title="Users" role="platform_admin">
      {/* Header actions */}
      <div className="flex justify-end mb-4">
        <Button className="gap-2" onClick={() => setAddUserOpen(true)}>
          <UserPlus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={342} icon={Users} />
        <StatCard label="Active" value={298} icon={ShieldCheck} />
        <StatCard label="Pending" value={31} icon={UserCheck} />
        <StatCard label="Suspended" value={13} icon={ShieldOff} />
      </div>

      {/* Filters */}
      <div className="card mt-6">
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
                <th className="table-th">Email</th>
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
                  <td className="table-td text-[#1A1A1A]">{user.email}</td>
                  <td className="table-td">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="table-td">
                    <StatusBadge status={user.status} />
                  </td>
                  <td className="table-td text-[#555555]">{user.created}</td>
                  <td className="table-td">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </Button>
                      {user.status === 'suspended' ? (
                        <Button variant="secondary" size="sm" className="gap-1">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Activate
                        </Button>
                      ) : (
                        <Button variant="danger" size="sm" className="gap-1">
                          <ShieldOff className="h-3.5 w-3.5" />
                          Suspend
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={6} className="table-td text-center text-[#888888] py-8">
                    No users match your search.
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
      </div>
      <AddUserModal
        open={addUserOpen}
        onClose={() => setAddUserOpen(false)}
      />
    </AppLayout>
  )
}
