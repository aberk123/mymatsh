'use client'

import Link from 'next/link'
import {
  LayoutDashboard,
  UserCircle,
  Heart,
  MessageSquare,
  ChevronRight,
  DollarSign,
  CheckCircle,
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { WelcomeBanner } from '@/components/ui/welcome-banner'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import type { NavItem } from '@/components/ui/sidebar'

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/portal/parent', icon: LayoutDashboard },
  { label: 'My Child', href: '/portal/parent/child', icon: UserCircle },
  { label: 'Suggestions', href: '/portal/parent/matches', icon: Heart },
  { label: 'Messages', href: '/portal/parent/messages', icon: MessageSquare, badge: '1' },
]

const mockSuggestions = [
  {
    id: '1',
    status: 'pending',
    shadchanName: 'Rabbi Sternberg',
    date: 'Apr 18, 2026',
  },
  {
    id: '2',
    status: 'current',
    shadchanName: 'Mrs. Goldberg',
    date: 'Apr 10, 2026',
  },
]

const recentMessages = [
  {
    id: '1',
    from: 'Rabbi Sternberg',
    body: "Shalom! I wanted to update you on the suggestion for Devorah. Things are progressing well.",
    time: 'Today, 2:14 PM',
  },
  {
    id: '2',
    from: 'Mrs. Goldberg',
    body: "Good afternoon! I have some exciting news regarding the current suggestion.",
    time: 'Yesterday',
  },
]

export default function ParentDashboardPage() {
  return (
    <AppLayout navItems={navItems} title="Parent Dashboard" role="parent">
      <WelcomeBanner
        greeting="Shalom, Mr. & Mrs. Cohen"
        subtitle="Stay updated on your child's shidduch process."
        steps={[
          { number: 1, label: 'Review Profile' },
          { number: 2, label: 'View Suggestions' },
          { number: 3, label: 'Communicate' },
        ]}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
        {/* Your Child */}
        <div className="card flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#1A1A1A]">Your Child</h3>
            <Link href="/portal/parent/child">
              <Button variant="ghost" size="sm" className="text-brand-maroon gap-1">
                View Profile <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
          <div className="flex flex-col items-center gap-3 py-2">
            <Avatar name="Devorah Cohen" size="lg" />
            <div className="text-center">
              <p className="font-semibold text-[#1A1A1A]">Devorah Cohen</p>
              <p className="text-sm text-[#555555]">Age 25 · Lakewood, NJ</p>
              <div className="mt-2 flex justify-center">
                <StatusBadge status="available" />
              </div>
            </div>
          </div>
          <Link href="/portal/parent/child">
            <Button variant="outline-maroon" size="sm" className="w-full">
              View Full Profile
            </Button>
          </Link>
        </div>

        {/* Active Suggestions */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#1A1A1A]">Active Suggestions</h3>
            <Link href="/portal/parent/matches">
              <Button variant="ghost" size="sm" className="text-brand-maroon gap-1">
                View All <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {mockSuggestions.map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-[#FAFAFA] border border-gray-100">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1A1A1A]">Suggestion #{s.id}</p>
                  <p className="text-xs text-[#888888] mt-0.5">
                    Via {s.shadchanName} · {s.date}
                  </p>
                </div>
                <StatusBadge status={s.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Pledge */}
        <div className="card flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-[#1A1A1A]">Pledge Amount</h3>
          </div>
          <div>
            <p className="text-3xl font-bold text-[#1A1A1A]">$3,600</p>
            <div className="flex items-center gap-1.5 mt-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-600 font-medium">Confirmed</span>
            </div>
            <p className="text-xs text-[#888888] mt-0.5">Confirmed on Apr 1, 2026</p>
          </div>
          <p className="text-xs text-[#888888] border-t border-gray-100 pt-3">
            Your pledge supports your child&apos;s shidduch process. Thank you for your commitment.
          </p>
        </div>
      </div>

      {/* Recent Messages */}
      <div className="card mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#1A1A1A]">Recent Messages</h3>
          <Link href="/portal/parent/messages">
            <Button variant="ghost" size="sm" className="text-brand-maroon gap-1">
              View All <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
        <div className="space-y-3">
          {recentMessages.map((msg) => (
            <div key={msg.id} className="flex items-start gap-3 p-3 rounded-lg bg-[#FAFAFA] border border-gray-100">
              <Avatar name={msg.from} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[#1A1A1A]">{msg.from}</p>
                  <span className="text-xs text-[#888888] flex-shrink-0">{msg.time}</span>
                </div>
                <p className="text-sm text-[#555555] mt-0.5 line-clamp-2">{msg.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}
