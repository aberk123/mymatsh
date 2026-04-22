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
  UsersRound,
  Home,
  BookOpen,
  MessageSquare,
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

const mockParents = [
  { id: '1', name: 'Reb Moshe Goldstein', city: 'Lakewood, NJ', email: 'm.goldstein@example.com', phone: '(732) 555-0101', childName: 'Yosef Goldstein', childStatus: 'available', status: 'active' },
  { id: '2', name: 'Rivka Weiss', city: 'Brooklyn, NY', email: 'r.weiss@example.com', phone: '(718) 555-0202', childName: 'Devorah Weiss', childStatus: 'available', status: 'active' },
  { id: '3', name: 'Avraham Schwartz', city: 'Monsey, NY', email: 'a.schwartz@example.com', phone: '(845) 555-0303', childName: 'Dovid Schwartz', childStatus: 'on_hold', status: 'active' },
  { id: '4', name: 'Chana Blum', city: 'Lakewood, NJ', email: 'c.blum@example.com', phone: '(732) 555-0404', childName: 'Rivka Blum', childStatus: 'available', status: 'active' },
  { id: '5', name: 'Shmuel Horowitz', city: 'Teaneck, NJ', email: 's.horowitz@example.com', phone: '(201) 555-0505', childName: 'Chana Horowitz', childStatus: 'on_hold', status: 'active' },
  { id: '6', name: 'Devorah Stern', city: 'Baltimore, MD', email: 'd.stern@example.com', phone: '(410) 555-0606', childName: 'Leah Stern', childStatus: 'available', status: 'active' },
  { id: '7', name: 'Pinchas Lerner', city: 'Chicago, IL', email: 'p.lerner@example.com', phone: '(312) 555-0707', childName: 'Binyamin Lerner', childStatus: 'inactive', status: 'active' },
]

export default function AdminParentsPage() {
  const [search, setSearch] = useState('')

  const filtered = mockParents.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.childName.toLowerCase().includes(search.toLowerCase()) ||
      p.city.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AppLayout navItems={navItems} title="Parents" role="platform_admin">
      <div className="card">
        <div className="relative mb-4 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#888888]" />
          <Input
            placeholder="Search parents or child name..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="table-th">Parent Name</th>
                <th className="table-th">City</th>
                <th className="table-th">Email</th>
                <th className="table-th">Phone</th>
                <th className="table-th">Child</th>
                <th className="table-th">Child Status</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="table-row">
                  <td className="table-td font-medium text-[#1A1A1A]">{p.name}</td>
                  <td className="table-td text-[#555555]">{p.city}</td>
                  <td className="table-td text-[#555555]">{p.email}</td>
                  <td className="table-td text-[#555555]">{p.phone}</td>
                  <td className="table-td text-[#555555]">{p.childName}</td>
                  <td className="table-td">
                    <StatusBadge status={p.childStatus} />
                  </td>
                  <td className="table-td">
                    <Button variant="ghost" size="sm" className="gap-1">
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="table-td text-center text-[#888888] py-8">
                    No parents found.
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
