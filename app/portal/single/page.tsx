'use client'

import Link from 'next/link'
import {
  LayoutDashboard,
  UserCircle,
  Heart,
  MessageSquare,
  Eye,
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { WelcomeBanner } from '@/components/ui/welcome-banner'
import { StatCard } from '@/components/ui/stat-card'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import type { NavItem } from '@/components/ui/sidebar'

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/portal/single', icon: LayoutDashboard },
  { label: 'My Profile', href: '/portal/single/profile', icon: UserCircle },
  { label: 'Suggestions', href: '/portal/single/matches', icon: Heart },
  { label: 'Messages', href: '/portal/single/messages', icon: MessageSquare, badge: '2' },
]

const mockSuggestions = [
  {
    id: '1',
    status: 'pending',
    shadchanInitials: 'RS',
    shadchanName: 'Rabbi Sternberg',
    date: 'Apr 18, 2026',
  },
  {
    id: '2',
    status: 'current',
    shadchanInitials: 'MG',
    shadchanName: 'Mrs. Goldberg',
    date: 'Apr 10, 2026',
  },
  {
    id: '3',
    status: 'going_out',
    shadchanInitials: 'RS',
    shadchanName: 'Rabbi Sternberg',
    date: 'Mar 28, 2026',
  },
]

const statusMessages: Record<string, string> = {
  pending: 'A suggestion has been made for you. Your Shadchan will be in touch.',
  current: 'This suggestion is being discussed.',
  going_out: 'Awaiting more details from your Shadchan.',
  on_hold: 'Awaiting more details from your Shadchan.',
}

export default function SingleDashboardPage() {
  return (
    <AppLayout navItems={navItems} title="My Dashboard" role="single">
      <WelcomeBanner
        greeting="Welcome, Devorah!"
        subtitle="Your shidduch journey continues."
        steps={[
          { number: 1, label: 'Complete Profile' },
          { number: 2, label: 'Review Suggestions' },
          { number: 3, label: 'Stay in Touch' },
        ]}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <StatCard label="Profile Views" value={12} icon={Eye} />
        <StatCard label="Active Suggestions" value={3} icon={Heart} />
        <StatCard label="Messages" value={2} icon={MessageSquare} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
        {/* Profile Completion */}
        <div className="card flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#1A1A1A]">Profile Completion</h3>
            <span className="text-sm font-bold text-brand-maroon">75%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div
              className="h-2.5 rounded-full bg-brand-maroon"
              style={{ width: '75%' }}
            />
          </div>
          <p className="text-sm text-[#555555]">
            Complete your profile so your Shadchan can find the best suggestions for you.
          </p>
          <Link href="/portal/single/profile">
            <Button variant="primary" size="sm" className="w-full">
              Complete Profile
            </Button>
          </Link>
        </div>

        {/* Your Suggestions */}
        <div className="xl:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#1A1A1A]">Your Suggestions</h3>
            <Link href="/portal/single/matches">
              <Button variant="ghost" size="sm" className="text-brand-maroon">
                View All
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {mockSuggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-[#FAFAFA] border border-gray-100"
              >
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-[#F8F0F5] flex items-center justify-center text-xs font-bold text-brand-maroon">
                  {suggestion.shadchanInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1A1A1A]">
                    {statusMessages[suggestion.status] ?? 'A suggestion is pending.'}
                  </p>
                  <p className="text-xs text-[#888888] mt-0.5">
                    Via {suggestion.shadchanName} · {suggestion.date}
                  </p>
                </div>
                <StatusBadge status={suggestion.status} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Your Shadchan */}
      <div className="card mt-6">
        <h3 className="font-semibold text-[#1A1A1A] mb-4">Your Shadchan</h3>
        <div className="flex items-center gap-4">
          <Avatar name="Rabbi Sternberg" size="lg" />
          <div className="flex-1">
            <p className="font-semibold text-[#1A1A1A]">Rabbi Sternberg</p>
            <p className="text-sm text-[#555555]">Brooklyn, NY</p>
            <p className="text-sm text-[#888888] mt-0.5">rabbi.sternberg@mymatsh.com</p>
          </div>
          <Link href="/portal/single/messages">
            <Button variant="primary" size="sm" className="gap-2">
              <MessageSquare className="h-3.5 w-3.5" />
              Send Message
            </Button>
          </Link>
        </div>
      </div>
    </AppLayout>
  )
}
