'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  UserCircle,
  Heart,
  MessageSquare,
  UserX,
  UserPlus,
  MapPin,
  GraduationCap,
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import type { NavItem } from '@/components/ui/sidebar'
import { useUnreadMessageCount } from '@/lib/use-unread-messages'
import { createClient } from '@/lib/supabase/client'

interface ChildProfile {
  first_name: string
  last_name: string
  gender: string
  age: number | null
  dob: string | null
  city: string | null
  state: string | null
  status: string
  about_bio: string | null
  current_yeshiva_seminary: string | null
  hashkafa: string | null
  plans: string | null
  photo_url: string | null
}

export default function ParentChildProfilePage() {
  const router = useRouter()
  const unreadMsgCount = useUnreadMessageCount()
  const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/portal/parent', icon: LayoutDashboard },
    { label: 'My Child', href: '/portal/parent/child', icon: UserCircle },
    { label: 'Suggestions', href: '/portal/parent/matches', icon: Heart },
    { label: 'Messages', href: '/portal/parent/messages', icon: MessageSquare, ...(unreadMsgCount > 0 ? { badge: String(unreadMsgCount) } : {}) },
  ]

  const [loading, setLoading] = useState(true)
  const [child, setChild] = useState<ChildProfile | null>(null)
  const [hasParent, setHasParent] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: parent } = await (supabase.from('parents') as any)
        .select('id, child_id')
        .eq('user_id', user.id)
        .maybeSingle() as { data: { id: string; child_id: string | null } | null }

      if (!parent) { setLoading(false); return }
      setHasParent(true)

      if (!parent.child_id) { setLoading(false); return }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: childData } = await (supabase.from('singles') as any)
        .select('first_name, last_name, gender, age, dob, city, state, status, about_bio, current_yeshiva_seminary, hashkafa, plans, photo_url')
        .eq('id', parent.child_id)
        .maybeSingle() as { data: ChildProfile | null }

      setChild(childData)
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) {
    return (
      <AppLayout navItems={navItems} title="Child's Profile" role="parent">
        <div className="flex items-center justify-center py-24 text-[#888888] text-sm">Loading…</div>
      </AppLayout>
    )
  }

  if (!hasParent) {
    return (
      <AppLayout navItems={navItems} title="Child's Profile" role="parent">
        <div className="card flex flex-col items-center justify-center py-16 text-center gap-3 max-w-md mx-auto">
          <div className="h-14 w-14 rounded-full bg-[#F8F0F5] flex items-center justify-center">
            <UserX className="h-7 w-7 text-brand-maroon" />
          </div>
          <h3 className="text-lg font-semibold text-[#1A1A1A]">Profile Not Found</h3>
          <p className="text-sm text-[#555555] leading-relaxed">
            Your parent profile hasn&apos;t been set up. Please contact support.
          </p>
        </div>
      </AppLayout>
    )
  }

  if (!child) {
    return (
      <AppLayout navItems={navItems} title="Child's Profile" role="parent">
        <div className="card flex flex-col items-center justify-center py-16 text-center gap-4 max-w-md mx-auto">
          <div className="h-14 w-14 rounded-full bg-[#F8F0F5] flex items-center justify-center">
            <UserPlus className="h-7 w-7 text-brand-maroon" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#1A1A1A]">No Profile Yet</h3>
            <p className="text-sm text-[#555555] mt-1 leading-relaxed">
              Your child&apos;s profile hasn&apos;t been created yet.
            </p>
          </div>
          <Link href="/portal/parent/add-child">
            <Button variant="primary" size="sm" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Add Your Child&apos;s Profile
            </Button>
          </Link>
        </div>
      </AppLayout>
    )
  }

  const fullName = `${child.first_name} ${child.last_name}`
  const location = [child.city, child.state].filter(Boolean).join(', ')

  return (
    <AppLayout navItems={navItems} title="Child's Profile" role="parent">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Header card */}
        <div className="card flex items-start gap-4">
          {child.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={child.photo_url}
              alt={fullName}
              className="h-20 w-20 rounded-full object-cover border border-gray-200 flex-shrink-0"
            />
          ) : (
            <div className="flex-shrink-0">
              <Avatar name={fullName} size="lg" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h1 className="text-xl font-semibold text-[#1A1A1A]">{fullName}</h1>
                <p className="text-sm text-[#888888] mt-0.5 capitalize">{child.gender}</p>
              </div>
              <StatusBadge status={child.status} />
            </div>
            <div className="flex flex-wrap gap-3 mt-3 text-sm text-[#555555]">
              {child.age && (
                <span>Age {child.age}</span>
              )}
              {location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-[#888888]" />
                  {location}
                </span>
              )}
              {child.current_yeshiva_seminary && (
                <span className="flex items-center gap-1">
                  <GraduationCap className="h-3.5 w-3.5 text-[#888888]" />
                  {child.current_yeshiva_seminary}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Profile details */}
        {(child.hashkafa || child.plans || child.about_bio) && (
          <div className="card space-y-4">
            {child.hashkafa && (
              <div>
                <p className="text-xs font-medium text-[#888888] uppercase tracking-wide">Hashkafa</p>
                <p className="text-sm text-[#1A1A1A] mt-0.5 capitalize">{child.hashkafa.replace('_', ' ')}</p>
              </div>
            )}
            {child.plans && (
              <div>
                <p className="text-xs font-medium text-[#888888] uppercase tracking-wide">Plans</p>
                <p className="text-sm text-[#1A1A1A] mt-0.5">{child.plans}</p>
              </div>
            )}
            {child.about_bio && (
              <div>
                <p className="text-xs font-medium text-[#888888] uppercase tracking-wide">About</p>
                <p className="text-sm text-[#1A1A1A] mt-0.5 whitespace-pre-wrap leading-relaxed">{child.about_bio}</p>
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-[#888888] text-center">
          To update your child&apos;s profile, please contact your assigned shadchan.
        </p>
      </div>
    </AppLayout>
  )
}
