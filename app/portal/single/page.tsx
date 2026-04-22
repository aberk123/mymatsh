'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard,
  UserCircle,
  Heart,
  MessageSquare,
  Eye,
  User,
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { WelcomeBanner } from '@/components/ui/welcome-banner'
import { StatCard } from '@/components/ui/stat-card'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import type { NavItem } from '@/components/ui/sidebar'
import { createClient } from '@/lib/supabase/client'

interface SuggestionRow {
  id: string
  status: string
  message: string | null
  created_at: string
}

interface ShadchanInfo {
  name: string
  location: string
  email: string
}

const statusMessages: Record<string, string> = {
  pending: 'A suggestion has been made for you. Your Shadchan will be in touch.',
  current: 'This suggestion is being discussed.',
  going_out: 'Awaiting more details from your Shadchan.',
  on_hold: 'Awaiting more details from your Shadchan.',
}

function calcCompletion(single: Record<string, unknown>): number {
  const fields = [
    'first_name', 'last_name', 'full_hebrew_name', 'dob',
    'about_bio', 'looking_for', 'city', 'occupation', 'hashkafa', 'family_background',
  ]
  const filled = fields.filter((f) => single[f]).length
  return Math.round((filled / fields.length) * 100)
}

export default function SingleDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [firstName, setFirstName] = useState('')
  const [singleRecord, setSingleRecord] = useState<Record<string, unknown> | null>(null)
  const [suggestions, setSuggestions] = useState<SuggestionRow[]>([])
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [shadchan, setShadchan] = useState<ShadchanInfo | null>(null)

  useEffect(() => {
    const supabase = createClient()

    async function loadDashboard() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const metaName = (user.user_metadata?.first_name as string) ?? ''
      setFirstName(metaName)

      // Get this user's single record
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: single } = await (supabase.from('singles') as any)
        .select('id, first_name, last_name, full_hebrew_name, dob, about_bio, looking_for, city, state, occupation, hashkafa, family_background')
        .eq('user_id', user.id)
        .maybeSingle() as { data: Record<string, unknown> | null }

      if (!single) { setLoading(false); return }

      const singleId = single.id as string
      setSingleRecord(single)
      if (single.first_name) setFirstName(single.first_name as string)

      // Active suggestions (not past/engaged/married)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: matchRows } = await (supabase.from('matches') as any)
        .select('id, status, message, created_at')
        .or(`boy_id.eq.${singleId},girl_id.eq.${singleId}`)
        .not('status', 'in', '(past,engaged,married)')
        .order('created_at', { ascending: false })
        .limit(3) as { data: SuggestionRow[] | null }

      setSuggestions(matchRows ?? [])

      // Unread messages
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count } = await (supabase.from('messages') as any)
        .select('id', { count: 'exact', head: true })
        .eq('to_user_id', user.id)
        .eq('is_read', false) as { count: number | null }

      setUnreadMessages(count ?? 0)

      // Assigned shadchan from accepted representation request
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: repr } = await (supabase.from('representation_requests') as any)
        .select('shadchan_id')
        .eq('single_id', singleId)
        .eq('status', 'accepted')
        .maybeSingle() as { data: { shadchan_id: string } | null }

      if (repr?.shadchan_id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: sp } = await (supabase.from('shadchan_profiles') as any)
          .select('full_name, city, state, email')
          .eq('id', repr.shadchan_id)
          .maybeSingle() as { data: { full_name: string; city: string | null; state: string | null; email: string | null } | null }

        if (sp) {
          setShadchan({
            name: sp.full_name,
            location: [sp.city, sp.state].filter(Boolean).join(', '),
            email: sp.email ?? '',
          })
        }
      }

      setLoading(false)
    }

    loadDashboard()
  }, [])

  const completion = singleRecord ? calcCompletion(singleRecord) : 0

  // Build nav items here so Messages badge reflects real unread count
  const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/portal/single', icon: LayoutDashboard },
    { label: 'My Profile', href: '/portal/single/profile', icon: UserCircle },
    { label: 'Suggestions', href: '/portal/single/matches', icon: Heart },
    {
      label: 'Messages',
      href: '/portal/single/messages',
      icon: MessageSquare,
      badge: unreadMessages > 0 ? String(unreadMessages) : undefined,
    },
  ]

  if (loading) {
    return (
      <AppLayout navItems={navItems} title="My Dashboard" role="single">
        <div className="flex items-center justify-center py-24 text-[#888888] text-sm">Loading…</div>
      </AppLayout>
    )
  }

  return (
    <AppLayout navItems={navItems} title="My Dashboard" role="single">
      <WelcomeBanner
        greeting={`Welcome${firstName ? `, ${firstName}` : ''}!`}
        subtitle="Your shidduch journey continues."
        steps={[
          { number: 1, label: 'Complete Profile' },
          { number: 2, label: 'Review Suggestions' },
          { number: 3, label: 'Stay in Touch' },
        ]}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <StatCard label="Profile Views" value={0} icon={Eye} />
        <StatCard label="Active Suggestions" value={suggestions.length} icon={Heart} />
        <StatCard label="Unread Messages" value={unreadMessages} icon={MessageSquare} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
        {/* Profile Completion */}
        <div className="card flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#1A1A1A]">Profile Completion</h3>
            <span className="text-sm font-bold text-brand-maroon">{completion}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div
              className="h-2.5 rounded-full bg-brand-maroon transition-all"
              style={{ width: `${completion}%` }}
            />
          </div>
          <p className="text-sm text-[#555555]">
            Complete your profile so your Shadchan can find the best suggestions for you.
          </p>
          <Link href="/portal/single/profile">
            <Button variant="primary" size="sm" className="w-full">
              {completion === 100 ? 'View Profile' : 'Complete Profile'}
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
          {suggestions.length === 0 ? (
            <p className="text-sm text-[#888888] py-6 text-center">
              No suggestions yet. Your Shadchan will be in touch soon.
            </p>
          ) : (
            <div className="space-y-3">
              {suggestions.map((s, idx) => (
                <div
                  key={s.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-[#FAFAFA] border border-gray-100"
                >
                  <div className="flex-shrink-0 w-9 h-9 rounded-full bg-[#F8F0F5] flex items-center justify-center text-xs font-bold text-brand-maroon">
                    #{idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1A1A1A]">
                      {statusMessages[s.status] ?? 'A suggestion is pending.'}
                    </p>
                    <p className="text-xs text-[#888888] mt-0.5">
                      {new Date(s.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </p>
                  </div>
                  <StatusBadge status={s.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Your Shadchan */}
      <div className="card mt-6">
        <h3 className="font-semibold text-[#1A1A1A] mb-4">Your Shadchan</h3>
        {shadchan ? (
          <div className="flex items-center gap-4">
            <Avatar name={shadchan.name} size="lg" />
            <div className="flex-1">
              <p className="font-semibold text-[#1A1A1A]">{shadchan.name}</p>
              {shadchan.location && <p className="text-sm text-[#555555]">{shadchan.location}</p>}
              {shadchan.email && <p className="text-sm text-[#888888] mt-0.5">{shadchan.email}</p>}
            </div>
            <Link href="/portal/single/messages">
              <Button variant="primary" size="sm" className="gap-2">
                <MessageSquare className="h-3.5 w-3.5" />
                Send Message
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <User className="h-6 w-6 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#555555]">No shadchan assigned yet</p>
              <p className="text-xs text-[#888888] mt-0.5">
                A shadchan will be linked to your profile once one is assigned.
              </p>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
