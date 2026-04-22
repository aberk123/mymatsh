'use client'

import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Eye,
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { EmptyState } from '@/components/ui/empty-state'
import type { NavItem } from '@/components/ui/sidebar'

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/portal/advocate', icon: LayoutDashboard },
  { label: 'My Singles', href: '/portal/advocate/singles', icon: Users },
  { label: 'Messages', href: '/portal/advocate/messages', icon: MessageSquare, badge: '3' },
]

const mockSingles = [
  {
    id: '1',
    name: 'Devorah Levy',
    age: 25,
    city: 'Lakewood, NJ',
    status: 'available',
    shadchan: 'Rabbi Sternberg',
    activeSuggestions: 3,
  },
  {
    id: '2',
    name: 'Rivka Blum',
    age: 22,
    city: 'Baltimore, MD',
    status: 'available',
    shadchan: 'Mrs. Goldberg',
    activeSuggestions: 1,
  },
  {
    id: '3',
    name: 'Chana Weinstein',
    age: 24,
    city: 'Monsey, NY',
    status: 'on_hold',
    shadchan: 'Rabbi Sternberg',
    activeSuggestions: 0,
  },
  {
    id: '4',
    name: 'Miriam Fischer',
    age: 23,
    city: 'Chicago, IL',
    status: 'available',
    shadchan: 'Mrs. Feldman',
    activeSuggestions: 2,
  },
  {
    id: '5',
    name: 'Leah Schwartz',
    age: 26,
    city: 'Brooklyn, NY',
    status: 'draft',
    shadchan: 'Mrs. Goldberg',
    activeSuggestions: 0,
  },
]

export default function AdvocateSinglesPage() {
  return (
    <AppLayout navItems={navItems} title="My Singles" role="advocate">
      <div className="mb-6">
        <p className="text-sm text-[#555555]">
          View and monitor the singles you advocate for. Contact their Shadchan for any updates or
          concerns.
        </p>
      </div>

      {mockSingles.length === 0 ? (
        <EmptyState message="You are not currently advocating for any singles." />
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="table-th">Single</th>
                  <th className="table-th">Age</th>
                  <th className="table-th">City</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Shadchan</th>
                  <th className="table-th text-center">Active Suggestions</th>
                  <th className="table-th text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockSingles.map((single) => (
                  <tr key={single.id} className="table-row">
                    <td className="table-td">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={single.name} size="sm" />
                        <span className="font-medium text-[#1A1A1A]">{single.name}</span>
                      </div>
                    </td>
                    <td className="table-td text-[#555555]">{single.age}</td>
                    <td className="table-td text-[#555555]">{single.city}</td>
                    <td className="table-td">
                      <StatusBadge status={single.status} />
                    </td>
                    <td className="table-td text-[#555555]">{single.shadchan}</td>
                    <td className="table-td text-center">
                      {single.activeSuggestions > 0 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-maroon text-white text-xs font-bold">
                          {single.activeSuggestions}
                        </span>
                      ) : (
                        <span className="text-[#888888]">—</span>
                      )}
                    </td>
                    <td className="table-td text-center">
                      <Button variant="ghost" size="icon" className="h-7 w-7 mx-auto">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
