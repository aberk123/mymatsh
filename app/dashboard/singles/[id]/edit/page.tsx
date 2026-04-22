'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Heart,
  CalendarCheck,
  MessageSquare,
  UsersRound,
  UserCircle,
  ChevronLeft,
  Lock,
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
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

export default function EditSinglePage() {
  const params = useParams()

  return (
    <AppLayout navItems={navItems} title="Edit Single" role="shadchan">
      {/* Back */}
      <div className="mb-4">
        <Link
          href={`/dashboard/singles/${params.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-[#555555] hover:text-brand-maroon transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Profile
        </Link>
      </div>

      <div className="max-w-md mx-auto">
        <div className="card flex flex-col items-center justify-center py-14 text-center gap-4">
          <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
            <Lock className="h-8 w-8 text-gray-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#1A1A1A]">Edit Access Restricted</h2>
            <p className="text-sm text-[#555555] mt-2 leading-relaxed max-w-xs mx-auto">
              As a Shadchan, you cannot edit this single&apos;s personal information.
              The single or their parent manages their own profile from the Singles Portal.
            </p>
          </div>
          <div className="mt-2 flex flex-col gap-2 w-full max-w-xs">
            <Link href={`/dashboard/singles/${params.id}#notes`} className="w-full">
              <Button variant="primary" className="w-full">
                Add Private Notes
              </Button>
            </Link>
            <Link href={`/dashboard/singles/${params.id}`} className="w-full">
              <Button variant="secondary" className="w-full">
                View Profile
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
