'use client'

import {
  LayoutDashboard,
  UserCircle,
  Heart,
  MessageSquare,
  Clock,
  MessageCircle,
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { StatusBadge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
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
    shadchanName: 'Rabbi Sternberg',
    shadchanInitials: 'RS',
    date: 'Apr 18, 2026',
    message:
      'We have a wonderful suggestion for you. Please feel free to reach out to me with any questions.',
  },
  {
    id: '2',
    status: 'current',
    shadchanName: 'Mrs. Goldberg',
    shadchanInitials: 'MG',
    date: 'Apr 10, 2026',
    message:
      'Both parties have shown interest and we are currently in discussion. I will be in touch shortly.',
  },
  {
    id: '3',
    status: 'going_out',
    shadchanName: 'Rabbi Sternberg',
    shadchanInitials: 'RS',
    date: 'Mar 28, 2026',
    message:
      'Mazal Tov on moving forward! Please be in touch with me for next steps.',
  },
]

const statusMessages: Record<string, string> = {
  pending: 'A suggestion has been made for you. Your Shadchan will be in touch.',
  current: 'This suggestion is being discussed.',
  going_out: 'Awaiting more details from your Shadchan.',
  on_hold: 'Awaiting more details from your Shadchan.',
  past: 'This suggestion is no longer active.',
  engaged: 'Mazal Tov! This suggestion led to an engagement.',
  married: 'Mazal Tov! This suggestion led to a marriage.',
}

const statusBgClasses: Record<string, string> = {
  pending: 'bg-yellow-50 border-yellow-100',
  current: 'bg-blue-50 border-blue-100',
  going_out: 'bg-green-50 border-green-100',
  on_hold: 'bg-gray-50 border-gray-100',
}

export default function SingleMatchesPage() {
  return (
    <AppLayout navItems={navItems} title="My Suggestions" role="single">
      <div className="mb-6">
        <p className="text-sm text-[#555555]">
          Your Shadchan carefully reviews each suggestion before sharing details. Identities are kept
          private until the appropriate time.
        </p>
      </div>

      {mockSuggestions.length === 0 ? (
        <EmptyState message="No suggestions yet. Your Shadchan will be in touch soon." />
      ) : (
        <div className="space-y-4">
          {mockSuggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className={`card border ${statusBgClasses[suggestion.status] ?? 'bg-[#FAFAFA] border-gray-100'}`}
            >
              <div className="flex items-start gap-4">
                {/* Avatar placeholder */}
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#F8F0F5] flex items-center justify-center text-sm font-bold text-brand-maroon border-2 border-white shadow">
                  {suggestion.shadchanInitials}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-[#1A1A1A] text-sm">
                      Suggestion #{suggestion.id}
                    </p>
                    <StatusBadge status={suggestion.status} />
                  </div>

                  {/* Privacy notice */}
                  <p className="text-sm text-[#555555] mt-1.5">
                    {statusMessages[suggestion.status] ?? 'A suggestion is pending.'}
                  </p>

                  {/* Shadchan message */}
                  {suggestion.message && (
                    <div className="mt-2 p-2.5 rounded-lg bg-white border border-gray-100 flex items-start gap-2">
                      <MessageCircle className="h-4 w-4 text-brand-maroon mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-[#555555] italic">&ldquo;{suggestion.message}&rdquo;</p>
                    </div>
                  )}

                  {/* Meta */}
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-[#888888]">
                    <Clock className="h-3 w-3" />
                    <span>Via {suggestion.shadchanName} · {suggestion.date}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  )
}
