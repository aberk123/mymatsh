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
  Eye,
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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

const pendingAdvocates = [
  {
    id: '1',
    name: 'Tzipora Mandelbaum',
    city: 'Lakewood, NJ',
    email: 't.mandelbaum@example.com',
    languages: ['English', 'Yiddish'],
    dateApplied: 'Apr 19, 2026',
  },
  {
    id: '2',
    name: 'Binyamin Schwartz',
    city: 'Monsey, NY',
    email: 'b.schwartz@example.com',
    languages: ['English', 'Hebrew'],
    dateApplied: 'Apr 16, 2026',
  },
]

const allAdvocates = [
  { id: '3', name: 'Devorah Blum', city: 'Brooklyn, NY', email: 'd.blum@example.com', languages: ['English', 'Yiddish'], approved: true },
  { id: '4', name: 'Ari Friedman', city: 'Teaneck, NJ', email: 'a.friedman@example.com', languages: ['English'], approved: true },
  { id: '5', name: 'Shaina Goldberg', city: 'Baltimore, MD', email: 's.goldberg@example.com', languages: ['English', 'Hebrew', 'Russian'], approved: true },
  { id: '6', name: 'Nachum Peretz', city: 'Chicago, IL', email: 'n.peretz@example.com', languages: ['English', 'Hebrew'], approved: true },
  { id: '7', name: 'Malka Hirsch', city: 'Passaic, NJ', email: 'm.hirsch@example.com', languages: ['English', 'Yiddish'], approved: false },
  { id: '8', name: 'Chaim Lichtenstein', city: 'Lawrence, NY', email: 'c.lichten@example.com', languages: ['English'], approved: true },
  { id: '9', name: 'Esther Birnbaum', city: 'Lakewood, NJ', email: 'e.birnbaum@example.com', languages: ['English', 'Hebrew'], approved: true },
  { id: '10', name: 'Yankel Moskowitz', city: 'Crown Heights, NY', email: 'y.moskowitz@example.com', languages: ['English', 'Yiddish', 'Russian'], approved: false },
]

export default function AdminAdvocatesPage() {
  const [tab, setTab] = useState<'pending' | 'all'>('pending')
  const [pendingList, setPendingList] = useState(pendingAdvocates)

  const handleApprove = (id: string) => {
    setPendingList((prev) => prev.filter((a) => a.id !== id))
  }

  return (
    <AppLayout navItems={navItems} title="Advocates" role="platform_admin">
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
          All Advocates
          <span className="ml-2 bg-gray-100 text-gray-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
            {allAdvocates.length}
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
                  <th className="table-th">Languages</th>
                  <th className="table-th">Date Applied</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingList.map((a) => (
                  <tr key={a.id} className="table-row">
                    <td className="table-td font-medium text-[#1A1A1A]">{a.name}</td>
                    <td className="table-td text-[#555555]">{a.city}</td>
                    <td className="table-td text-[#555555]">{a.email}</td>
                    <td className="table-td text-[#555555]">{a.languages.join(', ')}</td>
                    <td className="table-td text-[#555555]">{a.dateApplied}</td>
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          className="gap-1"
                          onClick={() => handleApprove(a.id)}
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          Approve
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-1">
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {pendingList.length === 0 && (
                  <tr>
                    <td colSpan={6} className="table-td text-center text-[#888888] py-8">
                      No pending advocates.
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
                  <th className="table-th">Languages</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {allAdvocates.map((a) => (
                  <tr key={a.id} className="table-row">
                    <td className="table-td font-medium text-[#1A1A1A]">{a.name}</td>
                    <td className="table-td text-[#555555]">{a.city}</td>
                    <td className="table-td text-[#555555]">{a.email}</td>
                    <td className="table-td text-[#555555]">{a.languages.join(', ')}</td>
                    <td className="table-td">
                      <StatusBadge status={a.approved ? 'active' : 'pending'} />
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
