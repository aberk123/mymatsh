'use client'

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
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { WelcomeBanner } from '@/components/ui/welcome-banner'
import { StatCard } from '@/components/ui/stat-card'
import { Button } from '@/components/ui/button'
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

const pendingShadchanim = [
  { id: '1', name: 'Miriam Horowitz', city: 'Lakewood, NJ', email: 'miriam.h@example.com', dateApplied: 'Apr 18, 2026' },
  { id: '2', name: 'Yehuda Rosenberg', city: 'Brooklyn, NY', email: 'y.rosenberg@example.com', dateApplied: 'Apr 17, 2026' },
  { id: '3', name: 'Chana Feldman', city: 'Monsey, NY', email: 'chana.f@example.com', dateApplied: 'Apr 15, 2026' },
  { id: '4', name: 'Avigail Stern', city: 'Baltimore, MD', email: 'avigail.s@example.com', dateApplied: 'Apr 12, 2026' },
]

const recentActivity = [
  { id: '1', admin: 'admin@mymatsh.com', action: 'Approved Shadchan', target: 'Rivka Klein', time: '2 hours ago' },
  { id: '2', admin: 'admin@mymatsh.com', action: 'Suspended User', target: 'user_8fe2a1', time: '5 hours ago' },
  { id: '3', admin: 'admin@mymatsh.com', action: 'Added Organization', target: 'Yad L\'Bachur', time: 'Yesterday' },
  { id: '4', admin: 'admin@mymatsh.com', action: 'Deleted News Article', target: 'Spring Update 2026', time: 'Yesterday' },
  { id: '5', admin: 'admin@mymatsh.com', action: 'Approved Advocate', target: 'Devorah Blum', time: '2 days ago' },
]

const recentInquiries = [
  { id: '1', from: 'Yosef Goldstein', email: 'y.goldstein@example.com', subject: 'Account access issue', date: 'Apr 20, 2026' },
  { id: '2', from: 'Rachel Weiss', email: 'r.weiss@example.com', subject: 'Profile not showing in search', date: 'Apr 19, 2026' },
  { id: '3', from: 'Shmuel Katz', email: 's.katz@example.com', subject: 'Billing question', date: 'Apr 18, 2026' },
]

export default function AdminDashboardPage() {
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

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
        <StatCard label="Total Users" value={342} icon={Users} />
        <StatCard
          label="Pending Approvals"
          value={4}
          icon={UserCheck}
          onClick={() => window.location.assign('/admin/shadchanim')}
        />
        <StatCard label="Active Singles" value={187} icon={Heart} />
        <StatCard label="Organizations" value={12} icon={Building2} />
      </div>

      {/* Pending Approvals + Recent Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
        {/* Pending Approvals */}
        <div className="xl:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#1A1A1A]">Pending Approvals</h3>
            <Link href="/admin/shadchanim">
              <Button variant="ghost" size="sm" className="gap-1 text-brand-maroon">
                View All <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
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
                    <td className="table-td font-medium text-[#1A1A1A]">{s.name}</td>
                    <td className="table-td text-[#555555]">{s.city}</td>
                    <td className="table-td text-[#555555]">{s.email}</td>
                    <td className="table-td text-[#555555]">{s.dateApplied}</td>
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        <Button variant="primary" size="sm" className="gap-1">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Approve
                        </Button>
                        <Button variant="danger" size="sm" className="gap-1">
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
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#1A1A1A]">Recent Activity</h3>
            <Link href="/admin/audit-log">
              <Button variant="ghost" size="sm" className="gap-1 text-brand-maroon">
                View All <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {recentActivity.map((entry) => (
              <div key={entry.id} className="p-3 rounded-lg bg-[#FAFAFA] border border-gray-100">
                <p className="text-sm font-medium text-[#1A1A1A]">{entry.action}</p>
                <p className="text-xs text-[#555555] mt-0.5">Target: {entry.target}</p>
                <p className="text-xs text-[#888888] mt-0.5">{entry.time}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Contact Inquiries */}
      <div className="card mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#1A1A1A]">Recent Contact Inquiries</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="table-th">From</th>
                <th className="table-th">Email</th>
                <th className="table-th">Subject</th>
                <th className="table-th">Date</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentInquiries.map((inquiry) => (
                <tr key={inquiry.id} className="table-row">
                  <td className="table-td font-medium text-[#1A1A1A]">{inquiry.from}</td>
                  <td className="table-td text-[#555555]">{inquiry.email}</td>
                  <td className="table-td text-[#555555]">{inquiry.subject}</td>
                  <td className="table-td text-[#555555]">{inquiry.date}</td>
                  <td className="table-td">
                    <Button variant="secondary" size="sm">Reply</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  )
}
