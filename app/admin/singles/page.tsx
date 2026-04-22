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
  RefreshCw,
  UsersRound,
  Home,
  BookOpen,
  MessageSquare,
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

type Gender = 'boys' | 'girls'
type SingleStatus = 'available' | 'on_hold' | 'engaged' | 'married' | 'inactive'

const STATUS_OPTIONS: { value: SingleStatus; label: string }[] = [
  { value: 'available', label: 'Available' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'engaged', label: 'Engaged' },
  { value: 'married', label: 'Married' },
  { value: 'inactive', label: 'Inactive' },
]

const mockSingles = [
  { id: '1', name: 'Yosef Goldstein', gender: 'boys', age: 24, city: 'Lakewood, NJ', status: 'available', shadchan: 'Rivka Klein' },
  { id: '2', name: 'Dovid Schwartz', gender: 'boys', age: 26, city: 'Brooklyn, NY', status: 'on_hold', shadchan: 'Moshe Greenberg' },
  { id: '3', name: 'Menachem Rubin', gender: 'boys', age: 23, city: 'Monsey, NY', status: 'available', shadchan: 'Devorah Levi' },
  { id: '4', name: 'Avraham Katz', gender: 'boys', age: 25, city: 'Baltimore, MD', status: 'engaged', shadchan: 'Rivka Klein' },
  { id: '5', name: 'Shmuel Weissman', gender: 'boys', age: 22, city: 'Passaic, NJ', status: 'available', shadchan: 'Nechama Cohen' },
  { id: '6', name: 'Binyamin Lerner', gender: 'boys', age: 27, city: 'Chicago, IL', status: 'inactive', shadchan: '—' },
  { id: '7', name: 'Devorah Weiss', gender: 'girls', age: 21, city: 'Brooklyn, NY', status: 'available', shadchan: 'Moshe Greenberg' },
  { id: '8', name: 'Rivka Blum', gender: 'girls', age: 22, city: 'Lakewood, NJ', status: 'available', shadchan: 'Rivka Klein' },
  { id: '9', name: 'Chana Horowitz', gender: 'girls', age: 24, city: 'Teaneck, NJ', status: 'on_hold', shadchan: 'Devorah Levi' },
  { id: '10', name: 'Leah Stern', gender: 'girls', age: 20, city: 'Baltimore, MD', status: 'available', shadchan: 'Nechama Cohen' },
  { id: '11', name: 'Miriam Friedman', gender: 'girls', age: 23, city: 'Monsey, NY', status: 'engaged', shadchan: 'Avraham Katz' },
  { id: '12', name: 'Tzipora Cohen', gender: 'girls', age: 25, city: 'Lawrence, NY', status: 'inactive', shadchan: '—' },
]

export default function AdminSinglesPage() {
  const [gender, setGender] = useState<Gender>('boys')
  const [search, setSearch] = useState('')
  const [singles, setSingles] = useState(mockSingles)
  const [statusModalId, setStatusModalId] = useState<string | null>(null)
  const [newStatus, setNewStatus] = useState<SingleStatus>('available')

  const filtered = singles.filter(
    (s) =>
      s.gender === gender &&
      (s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.city.toLowerCase().includes(search.toLowerCase()))
  )

  const updating = singles.find((s) => s.id === statusModalId)

  function openStatusModal(id: string) {
    const s = singles.find((x) => x.id === id)
    if (s) {
      setNewStatus(s.status as SingleStatus)
      setStatusModalId(id)
    }
  }

  function handleStatusSave() {
    setSingles((prev) =>
      prev.map((s) => (s.id === statusModalId ? { ...s, status: newStatus } : s))
    )
    setStatusModalId(null)
  }

  const boysCount = singles.filter((s) => s.gender === 'boys').length
  const girlsCount = singles.filter((s) => s.gender === 'girls').length

  return (
    <AppLayout navItems={navItems} title="Singles" role="platform_admin">
      {/* Gender Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            gender === 'boys'
              ? 'border-brand-pink text-brand-pink'
              : 'border-transparent text-[#888888] hover:text-[#555555]'
          }`}
          onClick={() => setGender('boys')}
        >
          Boys
          <span className="ml-2 bg-gray-100 text-gray-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
            {boysCount}
          </span>
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            gender === 'girls'
              ? 'border-brand-pink text-brand-pink'
              : 'border-transparent text-[#888888] hover:text-[#555555]'
          }`}
          onClick={() => setGender('girls')}
        >
          Girls
          <span className="ml-2 bg-gray-100 text-gray-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
            {girlsCount}
          </span>
        </button>
      </div>

      <div className="card">
        <div className="relative mb-4 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#888888]" />
          <Input
            placeholder="Search singles..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="table-th">Name</th>
                <th className="table-th">Age</th>
                <th className="table-th">City</th>
                <th className="table-th">Shadchan</th>
                <th className="table-th">Status</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="table-row">
                  <td className="table-td font-medium text-[#1A1A1A]">{s.name}</td>
                  <td className="table-td text-[#555555]">{s.age}</td>
                  <td className="table-td text-[#555555]">{s.city}</td>
                  <td className="table-td text-[#555555]">{s.shadchan}</td>
                  <td className="table-td">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="table-td">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1"
                      onClick={() => openStatusModal(s.id)}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Update Status
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="table-td text-center text-[#888888] py-8">
                    No {gender} found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Update Dialog */}
      <Dialog open={statusModalId !== null} onOpenChange={(open) => { if (!open) setStatusModalId(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Update Status</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-2 space-y-3">
            <p className="text-sm text-[#555555]">
              Updating status for{' '}
              <span className="font-semibold text-[#1A1A1A]">{updating?.name}</span>.
            </p>
            <div>
              <Label className="field-label">New Status</Label>
              <select
                className="input-base mt-1 w-full"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as SingleStatus)}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <p className="text-xs text-[#888888]">
              Only status can be updated here. Personal profile details are managed by the assigned Shadchan.
            </p>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setStatusModalId(null)}>Cancel</Button>
            <Button onClick={handleStatusSave}>Save Status</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
