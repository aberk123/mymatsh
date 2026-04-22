'use client'

import {
  LayoutDashboard,
  UserCircle,
  Heart,
  MessageSquare,
  Clock,
  MessageCircle,
  StickyNote,
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { StatusBadge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
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
    shadchanContact: 'rabbi.sternberg@mymatsh.com',
    date: 'Apr 18, 2026',
    message:
      'We have a wonderful suggestion for Devorah. Please feel free to reach out to me directly with any questions.',
    notes:
      'The young man is from a very fine family in Brooklyn. He is currently learning in a kollel.',
  },
  {
    id: '2',
    status: 'current',
    shadchanName: 'Mrs. Goldberg',
    shadchanContact: 'mrs.goldberg@mymatsh.com',
    date: 'Apr 10, 2026',
    message:
      'Both parties have shown interest. We are currently in the process of gathering information.',
    notes: '',
  },
  {
    id: '3',
    status: 'going_out',
    shadchanName: 'Rabbi Sternberg',
    shadchanContact: 'rabbi.sternberg@mymatsh.com',
    date: 'Mar 28, 2026',
    message:
      'Things are progressing well. Please stay in close contact with me for updates.',
    notes: 'First date scheduled for next week. Details to follow.',
  },
]

const statusMessages: Record<string, string> = {
  pending: 'A suggestion has been submitted for your child. Your Shadchan will be in touch.',
  current: 'This suggestion is currently being discussed.',
  going_out: 'Your child is moving forward with this suggestion.',
  on_hold: 'This suggestion is currently on hold.',
  past: 'This suggestion is no longer active.',
}

const statusBg: Record<string, string> = {
  pending: 'border-yellow-100',
  current: 'border-blue-100',
  going_out: 'border-green-100',
  on_hold: 'border-gray-100',
}

export default function ParentMatchesPage() {
  return (
    <AppLayout navItems={navItems} title="Suggestions" role="parent">
      <div className="mb-6">
        <p className="text-sm text-[#555555]">
          You can view the status of each suggestion for your child. Identities of the other party
          remain private until your Shadchan decides it is appropriate to share.
        </p>
      </div>

      {mockSuggestions.length === 0 ? (
        <EmptyState message="No suggestions yet. Your Shadchan will be in touch soon." />
      ) : (
        <div className="space-y-4">
          {mockSuggestions.map((s) => (
            <div
              key={s.id}
              className={`card border ${statusBg[s.status] ?? 'border-gray-100'}`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#F8F0F5] flex items-center justify-center text-sm font-bold text-brand-maroon">
                  {s.shadchanName
                    .split(' ')
                    .map((w) => w[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-[#1A1A1A] text-sm">
                      Suggestion #{s.id}
                    </p>
                    <StatusBadge status={s.status} />
                  </div>
                  <p className="text-sm text-[#555555] mt-1.5">
                    {statusMessages[s.status] ?? 'Status update pending.'}
                  </p>

                  {/* Shadchan message */}
                  {s.message && (
                    <div className="mt-2 p-2.5 rounded-lg bg-white border border-gray-100 flex items-start gap-2">
                      <MessageCircle className="h-4 w-4 text-brand-maroon mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-[#555555] italic">&ldquo;{s.message}&rdquo;</p>
                    </div>
                  )}

                  {/* Notes */}
                  {s.notes && (
                    <div className="mt-2 p-2.5 rounded-lg bg-yellow-50 border border-yellow-100 flex items-start gap-2">
                      <StickyNote className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-yellow-800">{s.notes}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 mt-2 text-xs text-[#888888]">
                    <Clock className="h-3 w-3" />
                    <span>
                      Via {s.shadchanName} ({s.shadchanContact}) · {s.date}
                    </span>
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
