'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import type { NavItem } from '@/components/ui/sidebar'
import type { MatchStatus } from '@/types/database'
import { createClient } from '@/lib/supabase/client'

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'My Singles', href: '/dashboard/singles', icon: Users },
  { label: 'Suggestions', href: '/dashboard/matches', icon: Heart },
  { label: 'Calendar', href: '/dashboard/tasks', icon: CalendarCheck },
  { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
  { label: 'Groups', href: '/dashboard/groups', icon: UsersRound },
  { label: 'My Profile', href: '/dashboard/profile', icon: UserCircle },
]

const STATUS_OPTIONS: { value: MatchStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'current', label: 'Current' },
  { value: 'going_out', label: 'Going Out' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'past', label: 'Past' },
  { value: 'engaged', label: 'Engaged' },
  { value: 'married', label: 'Married' },
]

interface SingleInfo {
  id: string
  name: string
  age: number | null
  city: string
  hashkafa: string | null
}

interface MatchData {
  id: string
  status: MatchStatus
  message: string | null
  boy_id: string
  girl_id: string
  created_at: string
}

export default function MatchDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [match, setMatch] = useState<MatchData | null>(null)
  const [boy, setBoy] = useState<SingleInfo | null>(null)
  const [girl, setGirl] = useState<SingleInfo | null>(null)
  const [note, setNote] = useState('')
  const [noteSaving, setNoteSaving] = useState(false)
  const [noteError, setNoteError] = useState('')

  const [statusOpen, setStatusOpen] = useState(false)
  const [newStatus, setNewStatus] = useState<MatchStatus>('pending')
  const [statusSaving, setStatusSaving] = useState(false)
  const [statusError, setStatusError] = useState('')

  const [markPastLoading, setMarkPastLoading] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: matchRow } = await (supabase.from('matches') as any)
        .select('id, status, message, boy_id, girl_id, created_at')
        .eq('id', id)
        .maybeSingle() as { data: MatchData | null }

      if (!matchRow) { setLoading(false); return }

      setMatch(matchRow)
      setNote(matchRow.message ?? '')
      setNewStatus(matchRow.status)

      // Load boy and girl singles
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: boySingle } = await (supabase.from('singles') as any)
        .select('id, first_name, last_name, age, city, state, hashkafa')
        .eq('id', matchRow.boy_id)
        .maybeSingle() as {
          data: {
            id: string
            first_name: string
            last_name: string
            age: number | null
            city: string | null
            state: string | null
            hashkafa: string | null
          } | null
        }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: girlSingle } = await (supabase.from('singles') as any)
        .select('id, first_name, last_name, age, city, state, hashkafa')
        .eq('id', matchRow.girl_id)
        .maybeSingle() as {
          data: {
            id: string
            first_name: string
            last_name: string
            age: number | null
            city: string | null
            state: string | null
            hashkafa: string | null
          } | null
        }

      if (boySingle) {
        setBoy({
          id: boySingle.id,
          name: `${boySingle.first_name} ${boySingle.last_name}`.trim(),
          age: boySingle.age,
          city: [boySingle.city, boySingle.state].filter(Boolean).join(', ') || '—',
          hashkafa: boySingle.hashkafa,
        })
      }

      if (girlSingle) {
        setGirl({
          id: girlSingle.id,
          name: `${girlSingle.first_name} ${girlSingle.last_name}`.trim(),
          age: girlSingle.age,
          city: [girlSingle.city, girlSingle.state].filter(Boolean).join(', ') || '—',
          hashkafa: girlSingle.hashkafa,
        })
      }

      setLoading(false)
    }
    load()
  }, [id])

  async function handleSaveNote() {
    if (!match) return
    setNoteSaving(true)
    setNoteError('')
    try {
      const res = await fetch(`/api/matches/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: note }),
      })
      if (!res.ok) {
        const json = await res.json()
        setNoteError(json.error ?? 'Failed to save note.')
        return
      }
      setMatch((prev) => prev ? { ...prev, message: note } : prev)
    } catch {
      setNoteError('Network error. Please try again.')
    } finally {
      setNoteSaving(false)
    }
  }

  async function handleStatusSave() {
    if (!match) return
    setStatusSaving(true)
    setStatusError('')
    try {
      const res = await fetch(`/api/matches/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        const json = await res.json()
        setStatusError(json.error ?? 'Failed to update status.')
        return
      }
      setMatch((prev) => prev ? { ...prev, status: newStatus } : prev)
      setStatusOpen(false)
    } catch {
      setStatusError('Network error. Please try again.')
    } finally {
      setStatusSaving(false)
    }
  }

  async function handleMarkAsPast() {
    if (!match) return
    setMarkPastLoading(true)
    try {
      const res = await fetch(`/api/matches/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'past' }),
      })
      if (res.ok) {
        setMatch((prev) => prev ? { ...prev, status: 'past' } : prev)
      }
    } catch { /* ignore */ } finally {
      setMarkPastLoading(false)
    }
  }

  if (loading) {
    return (
      <AppLayout navItems={navItems} title="Suggestion Detail" role="shadchan">
        <div className="flex items-center justify-center py-24 text-[#888888] text-sm">Loading…</div>
      </AppLayout>
    )
  }

  if (!match) {
    return (
      <AppLayout navItems={navItems} title="Suggestion Detail" role="shadchan">
        <div className="flex items-center justify-center py-24 text-[#888888] text-sm">Suggestion not found.</div>
      </AppLayout>
    )
  }

  return (
    <AppLayout navItems={navItems} title="Suggestion Detail" role="shadchan">
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
          <Button
            variant="secondary"
            size="sm"
            className="gap-1.5 text-sm"
            onClick={() => { setNewStatus(match.status); setStatusOpen(true) }}
          >
            Update Status
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <h2 className="text-xl font-bold text-[#1A1A1A] mb-1">
        {boy?.name ?? '—'} &amp; {girl?.name ?? '—'}
      </h2>
      <p className="text-sm text-[#888888] mb-6">
        Created {new Date(match.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
      </p>

      {/* Two-column: Boy + Girl cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="card">
          <div className="flex items-start gap-4">
            <Avatar name={boy?.name ?? 'B'} size="lg" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[#1A1A1A]">{boy?.name ?? '—'}</p>
              {boy && (
                <>
                  <p className="text-sm text-[#555555] mt-0.5">
                    {boy.age ? `Age ${boy.age} · ` : ''}{boy.city}
                  </p>
                  <p className="text-sm text-[#888888]">{boy.hashkafa ?? ''}</p>
                  <Link
                    href={`/dashboard/singles/${boy.id}`}
                    className="inline-flex items-center gap-1 text-xs text-brand-maroon hover:underline mt-2"
                  >
                    View Profile <ExternalLink className="h-3 w-3" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-start gap-4">
            <Avatar name={girl?.name ?? 'G'} size="lg" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[#1A1A1A]">{girl?.name ?? '—'}</p>
              {girl && (
                <>
                  <p className="text-sm text-[#555555] mt-0.5">
                    {girl.age ? `Age ${girl.age} · ` : ''}{girl.city}
                  </p>
                  <p className="text-sm text-[#888888]">{girl.hashkafa ?? ''}</p>
                  <Link
                    href={`/dashboard/singles/${girl.id}`}
                    className="inline-flex items-center gap-1 text-xs text-brand-maroon hover:underline mt-2"
                  >
                    View Profile <ExternalLink className="h-3 w-3" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Match Notes */}
      <div className="card mb-6">
        <h3 className="font-semibold text-[#1A1A1A] mb-4">Match Notes</h3>
        {noteError && (
          <p className="text-xs text-red-600 mb-2">{noteError}</p>
        )}
        <textarea
          className="input-base w-full min-h-[80px] resize-none text-sm"
          placeholder="Add a note about this suggestion..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <div className="flex justify-end mt-2">
          <Button size="sm" className="btn-primary" onClick={handleSaveNote} disabled={noteSaving}>
            {noteSaving ? 'Saving…' : 'Save Note'}
          </Button>
        </div>
      </div>

      {/* Match Timeline */}
      <div className="card mb-6">
        <h3 className="font-semibold text-[#1A1A1A] mb-4">Match Timeline</h3>
        <div className="relative">
          <div className="absolute start-3 top-0 bottom-0 w-px bg-gray-200" />
          <div className="flex items-start gap-4 ps-9 relative">
            <div className="absolute start-0 w-7 h-7 rounded-full flex items-center justify-center border-2 bg-brand-maroon border-brand-maroon">
              <Clock className="h-3 w-3 text-white" />
            </div>
            <div className="flex-1 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={match.status} />
                <span className="text-xs text-[#888888]">
                  {new Date(match.created_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })}
                </span>
              </div>
              <p className="text-sm text-[#555555] mt-0.5">Suggestion created</p>
            </div>
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
            <Button
              variant="secondary"
              size="sm"
              className="text-red-600 border-red-300 hover:bg-red-50"
              onClick={handleMarkAsPast}
              disabled={markPastLoading || match.status === 'past'}
            >
              {markPastLoading ? 'Updating…' : 'Mark as Past'}
            </Button>
          </div>
        </div>
      </div>

      {/* Status Update Dialog */}
      <Dialog open={statusOpen} onOpenChange={(open) => { if (!open) setStatusOpen(false) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Update Status</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-2 space-y-3">
            <select
              className="input-base w-full"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as MatchStatus)}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {statusError && <p className="text-xs text-red-600">{statusError}</p>}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setStatusOpen(false)} disabled={statusSaving}>Cancel</Button>
            <Button onClick={handleStatusSave} disabled={statusSaving}>
              {statusSaving ? 'Saving…' : 'Save Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
