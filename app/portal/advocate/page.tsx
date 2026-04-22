'use client'

import Link from 'next/link'
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  ChevronRight,
  Heart,
  Bell,
  UserCheck,
  Clock,
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { WelcomeBanner } from '@/components/ui/welcome-banner'
import { StatCard } from '@/components/ui/stat-card'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
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
  },
  {
    id: '2',
    name: 'Rivka Blum',
    age: 22,
    city: 'Baltimore, MD',
    status: 'available',
    shadchan: 'Mrs. Goldberg',
  },
  {
    id: '3',
    name: 'Chana Weinstein',
    age: 24,
    city: 'Monsey, NY',
    status: 'on_hold',
    shadchan: 'Rabbi Sternberg',
  },
  {
    id: '4',
    name: 'Miriam Fischer',
    age: 23,
    city: 'Chicago, IL',
    status: 'available',
    shadchan: 'Mrs. Feldman',
  },
]

const recentActivity = [
  {
    id: '1',
    icon: Heart,
    text: 'New suggestion created for Devorah Levy',
    time: 'Today, 2:30 PM',
    color: 'text-brand-pink',
    bg: 'bg-pink-50',
  },
  {
    id: '2',
    icon: Bell,
    text: 'Rivka Blum profile updated by shadchan',
    time: 'Today, 11:00 AM',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    id: '3',
    icon: UserCheck,
    text: 'Chana Weinstein status changed to On Hold',
    time: 'Yesterday',
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
  },
  {
    id: '4',
    icon: MessageSquare,
    text: 'New message from Rabbi Sternberg about Devorah',
    time: 'Yesterday',
    color: 'text-brand-maroon',
    bg: 'bg-[#F8F0F5]',
  },
]

export default function AdvocateDashboardPage() {
  return (
    <AppLayout navItems={navItems} title="Advocate Dashboard" role="advocate">
      <WelcomeBanner
        greeting="Welcome, Mrs. Goldstein"
        subtitle="Advocate for the singles in your care."
        steps={[
          { number: 1, label: 'Review Singles' },
          { number: 2, label: 'Track Progress' },
          { number: 3, label: 'Stay Connected' },
        ]}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <StatCard label="Singles I Advocate For" value={4} icon={Users} />
        <StatCard label="Active Suggestions" value={6} icon={Heart} />
        <StatCard label="Messages" value={3} icon={MessageSquare} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
        {/* Singles Grid */}
        <div className="xl:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#1A1A1A]">Singles I Advocate For</h3>
            <Link href="/portal/advocate/singles">
              <Button variant="ghost" size="sm" className="text-brand-maroon gap-1">
                View All <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {mockSingles.map((single) => (
              <div key={single.id} className="p-3 rounded-lg bg-[#FAFAFA] border border-gray-100 flex items-start gap-3">
                <Avatar name={single.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-sm font-semibold text-[#1A1A1A] truncate">{single.name}</p>
                    <StatusBadge status={single.status} />
                  </div>
                  <p className="text-xs text-[#888888] mt-0.5">
                    Age {single.age} · {single.city}
                  </p>
                  <p className="text-xs text-[#555555] mt-0.5">Shadchan: {single.shadchan}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#1A1A1A]">Recent Activity</h3>
          </div>
          <div className="space-y-3">
            {recentActivity.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center`}>
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#1A1A1A] leading-snug">{item.text}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Clock className="h-3 w-3 text-[#888888]" />
                    <span className="text-xs text-[#888888]">{item.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
