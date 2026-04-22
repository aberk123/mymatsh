'use client'

import {
  LayoutDashboard,
  UserCircle,
  Heart,
  MessageSquare,
  UserX,
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import type { NavItem } from '@/components/ui/sidebar'

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/portal/parent', icon: LayoutDashboard },
  { label: 'My Child', href: '/portal/parent/child', icon: UserCircle },
  { label: 'Suggestions', href: '/portal/parent/matches', icon: Heart },
  { label: 'Messages', href: '/portal/parent/messages', icon: MessageSquare, badge: '1' },
]

export default function ParentChildProfilePage() {
  return (
    <AppLayout navItems={navItems} title="Child's Profile" role="parent">
      <div className="card flex flex-col items-center justify-center py-16 text-center gap-3 max-w-md mx-auto">
        <div className="h-14 w-14 rounded-full bg-[#F8F0F5] flex items-center justify-center">
          <UserX className="h-7 w-7 text-brand-maroon" />
        </div>
        <h3 className="text-lg font-semibold text-[#1A1A1A]">No Profile Yet</h3>
        <p className="text-sm text-[#555555] leading-relaxed">
          Your child&apos;s profile hasn&apos;t been set up yet. Your Shadchan will create and manage it on your behalf.
        </p>
        <p className="text-xs text-[#888888]">
          Once the profile is created, all details will appear here.
        </p>
      </div>
    </AppLayout>
  )
}
