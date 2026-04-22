'use client'

import Link from 'next/link'
import {
  LayoutDashboard,
  Users,
  Heart,
  CalendarCheck,
  MessageSquare,
  UsersRound,
  UserCircle,
  ArrowLeft,
  ExternalLink,
  Clock,
  ChevronDown,
  AlertTriangle,
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { Avatar } from '@/components/ui/avatar'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { NavItem } from '@/components/ui/sidebar'
import type { MatchStatus } from '@/types/database'

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'My Singles', href: '/dashboard/singles', icon: Users },
  { label: 'Suggestions', href: '/dashboard/matches', icon: Heart },
  { label: 'Calendar', href: '/dashboard/tasks', icon: CalendarCheck },
  { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare, badge: '3' },
  { label: 'Groups', href: '/dashboard/groups', icon: UsersRound },
  { label: 'My Profile', href: '/dashboard/profile', icon: UserCircle },
]

interface MockMatch {
  id: string
  status: MatchStatus
  createdAt: string
  boy: {
    id: string
    name: string
    age: number
    city: string
    hashkafa: string
  }
  girl: {
    id: string
    name: string
    age: number
    city: string
    hashkafa: string
  }
  notes: Array<{ id: string; author: string; text: string; date: string }>
  feedback: Array<{ id: string; from: string; text: string; date: string; sentiment: 'positive' | 'neutral' | 'negative' }>
  timeline: Array<{ id: string; status: MatchStatus; note: string; date: string }>
}

const mockMatches: Record<string, MockMatch> = {
  '1': {
    id: '1',
    status: 'current',
    createdAt: 'April 1, 2026',
    boy: { id: 'b1', name: 'Yosef Goldstein',   age: 26, city: 'Brooklyn, NY',  hashkafa: 'Modern Orthodox' },
    girl: { id: 'g1', name: 'Devorah Friedman', age: 23, city: 'Lakewood, NJ',  hashkafa: 'Yeshivish' },
    notes: [
      { id: 'n1', author: 'Mrs. Sarah Kessler', text: "Both families are very interested. Yosef's mother spoke with Devorah's mother and they had a very positive conversation.", date: 'Apr 3, 2026' },
      { id: 'n2', author: 'Mrs. Sarah Kessler', text: 'First phone call scheduled for Thursday evening.', date: 'Apr 5, 2026' },
    ],
    feedback: [
      { id: 'fb1', from: 'Yosef Goldstein', text: 'Had a great first call. She seems warm and thoughtful. Would like to continue.', date: 'Apr 7, 2026', sentiment: 'positive' },
      { id: 'fb2', from: 'Devorah Friedman', text: 'Enjoyed speaking with him. He is very grounded and kind. Looking forward to meeting in person.', date: 'Apr 7, 2026', sentiment: 'positive' },
    ],
    timeline: [
      { id: 't1', status: 'pending', note: 'Suggestion created', date: 'Apr 1, 2026' },
      { id: 't2', status: 'current', note: 'Both sides agreed to proceed', date: 'Apr 3, 2026' },
      { id: 't3', status: 'going_out', note: 'First date scheduled in Manhattan', date: 'Apr 8, 2026' },
    ],
  },
  '2': {
    id: '2',
    status: 'going_out',
    createdAt: 'March 28, 2026',
    boy: { id: 'b2', name: 'Shmuel Weiss',       age: 28, city: 'Monsey, NY',    hashkafa: 'Yeshivish' },
    girl: { id: 'g2', name: 'Rivka Blum',        age: 22, city: 'Baltimore, MD', hashkafa: 'Modern Orthodox' },
    notes: [
      { id: 'n1', author: 'Mrs. Sarah Kessler', text: 'Families know each other through mutual friends in Monsey.', date: 'Mar 29, 2026' },
    ],
    feedback: [
      { id: 'fb1', from: 'Shmuel Weiss', text: 'First date went well. Would like to go on a second date.', date: 'Apr 2, 2026', sentiment: 'positive' },
      { id: 'fb2', from: 'Rivka Blum', text: 'Nice, but not sure yet. Need more time to think.', date: 'Apr 2, 2026', sentiment: 'neutral' },
    ],
    timeline: [
      { id: 't1', status: 'pending',   note: 'Suggestion created',          date: 'Mar 28, 2026' },
      { id: 't2', status: 'current',   note: 'Both sides agreed',           date: 'Mar 30, 2026' },
      { id: 't3', status: 'going_out', note: 'Currently going on dates',    date: 'Apr 1, 2026' },
    ],
  },
}

function getFallbackMatch(id: string): MockMatch {
  return {
    id,
    status: 'pending',
    createdAt: 'April 10, 2026',
    boy:  { id: 'bx', name: 'Moshe Silverstein', age: 27, city: 'Brooklyn, NY',  hashkafa: 'Yeshivish' },
    girl: { id: 'gx', name: 'Rachel Stern',      age: 24, city: 'Lakewood, NJ',  hashkafa: 'Yeshivish' },
    notes: [{ id: 'n1', author: 'Mrs. Sarah Kessler', text: 'Initial notes pending.', date: 'Apr 10, 2026' }],
    feedback: [],
    timeline: [{ id: 't1', status: 'pending', note: 'Suggestion created', date: 'Apr 10, 2026' }],
  }
}

const sentimentClasses = {
  positive: 'bg-green-50 border-green-200',
  neutral:  'bg-gray-50 border-gray-200',
  negative: 'bg-red-50 border-red-200',
}


export default function MatchDetailPage({ params }: { params: { id: string } }) {
  const match = mockMatches[params.id] ?? getFallbackMatch(params.id)

  return (
    <AppLayout navItems={navItems} title="Suggestion Detail" role="shadchan">
      {/* Back link + status row */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Link
          href="/dashboard/matches"
          className="inline-flex items-center gap-1.5 text-sm text-[#555555] hover:text-brand-maroon transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Suggestions
        </Link>
        <div className="flex items-center gap-3">
          <StatusBadge status={match.status} />
          <div className="relative">
            <Button variant="secondary" size="sm" className="gap-1.5 text-sm">
              Update Status
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold text-[#1A1A1A] mb-1">
        {match.boy.name} &amp; {match.girl.name}
      </h2>
      <p className="text-sm text-[#888888] mb-6">Created {match.createdAt}</p>

      {/* Two-column: Boy + Girl cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Boy card */}
        <div className="card">
          <div className="flex items-start gap-4">
            <Avatar name={match.boy.name} size="lg" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[#1A1A1A]">{match.boy.name}</p>
              <p className="text-sm text-[#555555] mt-0.5">Age {match.boy.age} · {match.boy.city}</p>
              <p className="text-sm text-[#888888]">{match.boy.hashkafa}</p>
              <Link
                href={`/dashboard/singles/${match.boy.id}`}
                className="inline-flex items-center gap-1 text-xs text-brand-maroon hover:underline mt-2"
              >
                View Profile <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Girl card */}
        <div className="card">
          <div className="flex items-start gap-4">
            <Avatar name={match.girl.name} size="lg" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[#1A1A1A]">{match.girl.name}</p>
              <p className="text-sm text-[#555555] mt-0.5">Age {match.girl.age} · {match.girl.city}</p>
              <p className="text-sm text-[#888888]">{match.girl.hashkafa}</p>
              <Link
                href={`/dashboard/singles/${match.girl.id}`}
                className="inline-flex items-center gap-1 text-xs text-brand-maroon hover:underline mt-2"
              >
                View Profile <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Match Notes */}
      <div className="card mb-6">
        <h3 className="font-semibold text-[#1A1A1A] mb-4">Match Notes</h3>
        <div className="space-y-3 mb-4">
          {match.notes.map((note) => (
            <div key={note.id} className="p-3 rounded-lg bg-[#FAFAFA] border border-gray-100">
              <p className="text-sm text-[#1A1A1A]">{note.text}</p>
              <p className="text-xs text-[#888888] mt-1">{note.author} · {note.date}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 pt-4">
          <textarea
            className="input-base w-full min-h-[80px] resize-none text-sm"
            placeholder="Add a note..."
          />
          <div className="flex justify-end mt-2">
            <Button size="sm" className="btn-primary">Add Note</Button>
          </div>
        </div>
      </div>

      {/* Match Feedback */}
      <div className="card mb-6">
        <h3 className="font-semibold text-[#1A1A1A] mb-4">Match Feedback</h3>
        {match.feedback.length === 0 ? (
          <p className="text-sm text-[#888888]">No feedback recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {match.feedback.map((fb) => (
              <div key={fb.id} className={`p-3 rounded-lg border ${sentimentClasses[fb.sentiment]}`}>
                <p className="text-sm font-medium text-[#1A1A1A]">{fb.from}</p>
                <p className="text-sm text-[#555555] mt-1">{fb.text}</p>
                <p className="text-xs text-[#888888] mt-1">{fb.date}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Match Timeline */}
      <div className="card mb-6">
        <h3 className="font-semibold text-[#1A1A1A] mb-4">Match Timeline</h3>
        <div className="relative">
          <div className="absolute start-3 top-0 bottom-0 w-px bg-gray-200" />
          <div className="space-y-4">
            {match.timeline.map((event, idx) => (
              <div key={event.id} className="flex items-start gap-4 ps-9 relative">
                <div
                  className={`absolute start-0 w-7 h-7 rounded-full flex items-center justify-center border-2 ${
                    idx === match.timeline.length - 1
                      ? 'bg-brand-maroon border-brand-maroon'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <Clock className={`h-3 w-3 ${idx === match.timeline.length - 1 ? 'text-white' : 'text-[#888888]'}`} />
                </div>
                <div className="flex-1 pb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={event.status} />
                    <span className="text-xs text-[#888888]">{event.date}</span>
                  </div>
                  <p className="text-sm text-[#555555] mt-0.5">{event.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="card border border-red-200">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-[#1A1A1A]">Danger Zone</h3>
            <p className="text-sm text-[#555555] mt-0.5 mb-3">
              Marking this suggestion as past will close it and archive all related activity.
            </p>
            <Button variant="secondary" size="sm" className="text-red-600 border-red-300 hover:bg-red-50">
              Mark as Past
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
