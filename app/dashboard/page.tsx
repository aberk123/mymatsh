'use client'

import Link from 'next/link'
import {
  LayoutDashboard,
  Users,
  Heart,
  CalendarCheck,
  MessageSquare,
  UsersRound,
  UserCircle,
  Plus,
  ChevronRight,
  Eye,
  Pencil,
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { WelcomeBanner } from '@/components/ui/welcome-banner'
import { StatCard } from '@/components/ui/stat-card'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { NavItem } from '@/components/ui/sidebar'

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'My Singles', href: '/dashboard/singles', icon: Users },
  { label: 'Suggestions', href: '/dashboard/matches', icon: Heart },
  { label: 'Calendar', href: '/dashboard/tasks', icon: CalendarCheck },
  { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare, badge: '3' },
  { label: 'Groups', href: '/dashboard/groups', icon: UsersRound },
  { label: 'My Profile', href: '/dashboard/profile', icon: UserCircle },
]

const recentSingles = [
  { id: '1', name: 'Yosef Goldstein', gender: 'Male', age: 26, status: 'available', city: 'Brooklyn, NY' },
  { id: '2', name: 'Devorah Friedman', gender: 'Female', age: 23, status: 'available', city: 'Lakewood, NJ' },
  { id: '3', name: 'Shmuel Weiss', gender: 'Male', age: 28, status: 'on_hold', city: 'Monsey, NY' },
  { id: '4', name: 'Rivka Blum', gender: 'Female', age: 22, status: 'draft', city: 'Baltimore, MD' },
  { id: '5', name: 'Menachem Katz', gender: 'Male', age: 25, status: 'available', city: 'Chicago, IL' },
]

const upcomingTasks = [
  { id: '1', title: 'Follow up with Yosef Goldstein', dueDate: 'Today', type: 'follow_up' },
  { id: '2', title: 'Schedule date – Devorah & Shmuel', dueDate: 'Tomorrow', type: 'date_scheduled' },
  { id: '3', title: "Check in with Rivka's parents", dueDate: 'Apr 23', type: 'follow_up' },
  { id: '4', title: 'Review new résumé – Menachem Katz', dueDate: 'Apr 25', type: 'note' },
]

const taskTypeClasses: Record<string, string> = {
  follow_up: 'bg-blue-50 text-blue-700',
  date_scheduled: 'bg-green-50 text-green-700',
  on_hold: 'bg-yellow-50 text-yellow-700',
  note: 'bg-purple-50 text-purple-700',
  other: 'bg-gray-100 text-gray-600',
}

const taskTypeLabels: Record<string, string> = {
  follow_up: 'Follow Up',
  date_scheduled: 'Date',
  on_hold: 'On Hold',
  note: 'Note',
  other: 'Other',
}

export default function DashboardPage() {
  return (
    <AppLayout navItems={navItems} title="Dashboard" role="shadchan">
      {/* Welcome Banner */}
      <WelcomeBanner
        greeting="Welcome back, Sarah"
        subtitle="Here's what's happening with your singles today."
        steps={[
          { number: 1, label: 'Add Singles' },
          { number: 2, label: 'Create Suggestions' },
          { number: 3, label: 'Track Progress' },
        ]}
      />

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
        <StatCard
          label="My Singles"
          value={24}
          icon={Users}
          trend={{ value: 12, label: 'this month' }}
        />
        <StatCard
          label="Active Suggestions"
          value={8}
          icon={Heart}
        />
        <StatCard
          label="Tasks Due Today"
          value={3}
          icon={CalendarCheck}
          trend={{ value: -1, label: 'from yesterday' }}
        />
        <StatCard
          label="Unread Messages"
          value={5}
          icon={MessageSquare}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
        {/* Recent Singles */}
        <div className="xl:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#1A1A1A]">Recent Singles</h3>
            <Link href="/dashboard/singles">
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
                  <th className="table-th">Gender</th>
                  <th className="table-th">Age</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">City</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentSingles.map((single) => (
                  <tr key={single.id} className="table-row">
                    <td className="table-td font-medium text-[#1A1A1A]">{single.name}</td>
                    <td className="table-td text-[#555555]">{single.gender}</td>
                    <td className="table-td text-[#555555]">{single.age}</td>
                    <td className="table-td">
                      <StatusBadge status={single.status} />
                    </td>
                    <td className="table-td text-[#555555]">{single.city}</td>
                    <td className="table-td">
                      <div className="flex items-center gap-1">
                        <Link href={`/dashboard/singles/${single.id}`}>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <Link href={`/dashboard/singles/${single.id}/edit`}>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#1A1A1A]">Upcoming Tasks</h3>
            <Link href="/dashboard/tasks">
              <Button variant="ghost" size="sm" className="gap-1 text-brand-maroon">
                View All <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingTasks.map((task) => (
              <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg bg-[#FAFAFA] border border-gray-100">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1A1A1A] leading-snug">{task.title}</p>
                  <p className="text-xs text-[#888888] mt-0.5">{task.dueDate}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${taskTypeClasses[task.type]}`}>
                  {taskTypeLabels[task.type]}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Link href="/dashboard/tasks">
              <Button variant="outline-maroon" size="sm" className="w-full gap-2">
                <Plus className="h-3.5 w-3.5" />
                Add Task
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
