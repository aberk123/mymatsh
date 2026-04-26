'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard,
  UserCircle,
  Heart,
  MessageSquare,
  ChevronRight,
  DollarSign,
  CheckCircle,
  UserPlus,
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { WelcomeBanner } from '@/components/ui/welcome-banner'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { EmptyState } from '@/components/ui/empty-state'
import type { NavItem } from '@/components/ui/sidebar'
import { createClient } from '@/lib/supabase/client'

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/portal/parent', icon: LayoutDashboard },
  { label: 'My Child', href: '/portal/parent/child', icon: UserCircle },
  { label: 'Suggestions', href: '/portal/parent/matches', icon: Heart },
  { label: 'Messages', href: '/portal/parent/messages', icon: MessageSquare },
]

interface MatchSummary {
  id: string
  status: string
  created_at: string
}

interface MessageSummary {
  id: string
  from_user_id: string
  body: string
  created_at: string
  senderName: string
}

export default function ParentDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [parentName, setParentName] = useState('')
  const [childLinked, setChildLinked] = useState(false)
  const [childName, setChildName] = useState('')
  const [childAge, setChildAge] = useState<number | null>(null)
  const [childCity, setChildCity] = useState('')
  const [childStatus, setChildStatus] = useState('')
  const [pledgeAmount, setPledgeAmount] = useState<number | null>(null)
  const [pledgeConfirmedAt, setPledgeConfirmedAt] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<MatchSummary[]>([])
  const [recentMessages, setRecentMessages] = useState<MessageSummary[]>([])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: parent } = await (supabase.from('parents') as any)
        .select('id, full_name, child_id, pledge_amount, pledge_confirmed_at')
        .eq('user_id', user.id)
        .maybeSingle() as {
          data: {
            id: string
            full_name: string
            child_id: string
            pledge_amount: number | null
            pledge_confirmed_at: string | null
          } | null
        }

      if (!parent) { setLoading(false); return }

      setParentName(parent.full_name)
      setPledgeAmount(parent.pledge_amount)
      setPledgeConfirmedAt(parent.pledge_confirmed_at)

      // Load child's singles record
      let child = null
      if (parent.child_id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase.from('singles') as any)
          .select('first_name, last_name, age, city, state, status')
          .eq('id', parent.child_id)
          .maybeSingle() as {
            data: {
              first_name: string
              last_name: string
              age: number | null
              city: string | null
              state: string | null
              status: string
            } | null
          }
        child = data
      }
      setChildLinked(!!child)

      if (child) {
        setChildName(`${child.first_name} ${child.last_name}`.trim())
        setChildAge(child.age)
        setChildCity([child.city, child.state].filter(Boolean).join(', ') || '')
        setChildStatus(child.status)
      }

      // Load suggestions
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: matches } = await (supabase.from('matches') as any)
        .select('id, status, created_at')
        .or(`boy_id.eq.${parent.child_id},girl_id.eq.${parent.child_id}`)
        .not('status', 'in', '("past","married","engaged")')
        .order('created_at', { ascending: false })
        .limit(3) as { data: MatchSummary[] | null }

      setSuggestions(matches ?? [])

      // Load recent messages
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: msgs } = await (supabase.from('messages') as any)
        .select('id, from_user_id, body, created_at')
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(3) as { data: Array<{ id: string; from_user_id: string; body: string; created_at: string }> | null }

      if (msgs && msgs.length > 0) {
        const senderIds = Array.from(new Set(msgs.map((m) => m.from_user_id).filter((id) => id !== user.id)))
        const nameMap: Record<string, string> = {}

        for (const sid of senderIds) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: sp } = await (supabase.from('shadchan_profiles') as any)
            .select('full_name')
            .eq('user_id', sid)
            .maybeSingle() as { data: { full_name: string } | null }
          if (sp) nameMap[sid] = sp.full_name
        }

        setRecentMessages(msgs.map((m) => ({
          ...m,
          senderName: m.from_user_id === user.id ? 'You' : (nameMap[m.from_user_id] ?? 'Unknown'),
        })))
      }

      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <AppLayout navItems={navItems} title="Parent Dashboard" role="parent">
        <div className="flex items-center justify-center py-24 text-[#888888] text-sm">Loading…</div>
      </AppLayout>
    )
  }

  if (!parentName) {
    return (
      <AppLayout navItems={navItems} title="Parent Dashboard" role="parent">
        <EmptyState message="Parent profile not found. Please contact support." />
      </AppLayout>
    )
  }

  return (
    <AppLayout navItems={navItems} title="Parent Dashboard" role="parent">
      <WelcomeBanner
        greeting={`Shalom, ${parentName}`}
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
          {childLinked ? (
            <>
              <div className="flex flex-col items-center gap-3 py-2">
                <Avatar name={childName} size="lg" />
                <div className="text-center">
                  <p className="font-semibold text-[#1A1A1A]">{childName}</p>
                  <p className="text-sm text-[#555555]">
                    {childAge ? `Age ${childAge}` : ''}
                    {childAge && childCity ? ' · ' : ''}
                    {childCity}
                  </p>
                  {childStatus && (
                    <div className="mt-2 flex justify-center">
                      <StatusBadge status={childStatus} />
                    </div>
                  )}
                </div>
              </div>
              <Link href="/portal/parent/child">
                <Button variant="outline-maroon" size="sm" className="w-full">
                  View Full Profile
                </Button>
              </Link>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="w-14 h-14 rounded-full bg-[#F8F0F5] flex items-center justify-center">
                <UserPlus className="h-7 w-7 text-brand-maroon" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1A1A1A]">No profile yet</p>
                <p className="text-xs text-[#888888] mt-1 leading-relaxed">
                  Add your child&apos;s profile so a shadchan can begin the process.
                </p>
              </div>
              <Link href="/portal/parent/add-child" className="w-full">
                <Button variant="primary" size="sm" className="w-full gap-2">
                  <UserPlus className="h-4 w-4" />
                  Add Your Child&apos;s Profile
                </Button>
              </Link>
            </div>
          )}
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
          {suggestions.length === 0 ? (
            <p className="text-sm text-[#888888] text-center py-4">No active suggestions yet.</p>
          ) : (
            <div className="space-y-3">
              {suggestions.map((s, idx) => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-[#FAFAFA] border border-gray-100">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1A1A1A]">Suggestion #{idx + 1}</p>
                    <p className="text-xs text-[#888888] mt-0.5">
                      {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <StatusBadge status={s.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pledge */}
        <div className="card flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-[#1A1A1A]">Pledge Amount</h3>
          </div>
          {pledgeAmount ? (
            <div>
              <p className="text-3xl font-bold text-[#1A1A1A]">
                ${pledgeAmount.toLocaleString()}
              </p>
              {pledgeConfirmedAt && (
                <>
                  <div className="flex items-center gap-1.5 mt-1">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600 font-medium">Confirmed</span>
                  </div>
                  <p className="text-xs text-[#888888] mt-0.5">
                    Confirmed on {new Date(pledgeConfirmedAt).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </p>
                </>
              )}
            </div>
          ) : (
            <p className="text-sm text-[#888888]">No pledge on file.</p>
          )}
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
        {recentMessages.length === 0 ? (
          <p className="text-sm text-[#888888] text-center py-4">No messages yet.</p>
        ) : (
          <div className="space-y-3">
            {recentMessages.map((msg) => (
              <div key={msg.id} className="flex items-start gap-3 p-3 rounded-lg bg-[#FAFAFA] border border-gray-100">
                <Avatar name={msg.senderName} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[#1A1A1A]">{msg.senderName}</p>
                    <span className="text-xs text-[#888888] flex-shrink-0">
                      {new Date(msg.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-sm text-[#555555] mt-0.5 line-clamp-2">{msg.body}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
