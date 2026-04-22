'use client'

import { useState } from 'react'
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Building2,
  Heart,
  Newspaper,
  DollarSign,
  ClipboardList,
  Search,
  Reply,
  Mail,
  MailOpen,
  UsersRound,
  Home,
  BookOpen,
  MessageSquare,
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import type { NavItem } from '@/components/ui/sidebar'

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Shadchanim', href: '/admin/shadchanim', icon: UserCheck, badge: '4' },
  { label: 'Singles', href: '/admin/singles', icon: UsersRound },
  { label: 'Parents', href: '/admin/parents', icon: Home },
  { label: 'Advocates', href: '/admin/advocates', icon: Heart },
  { label: 'Maschilim', href: '/admin/maschilim', icon: BookOpen },
  { label: 'Messages', href: '/admin/messages', icon: MessageSquare },
  { label: 'Organizations', href: '/admin/organizations', icon: Building2 },
  { label: 'News', href: '/admin/news', icon: Newspaper },
  { label: 'Donations', href: '/admin/donations', icon: DollarSign },
  { label: 'Audit Log', href: '/admin/audit-log', icon: ClipboardList },
]

interface Message {
  id: string
  from: string
  email: string
  role: string
  subject: string
  body: string
  date: string
  read: boolean
}

const initialMessages: Message[] = [
  {
    id: '1',
    from: 'Yosef Goldstein',
    email: 'y.goldstein@example.com',
    role: 'Single',
    subject: 'Question about my profile',
    body: 'Hi, I noticed my profile hasn\'t been approved yet. I submitted it 3 days ago and was wondering if there\'s anything else you need from me. Thank you for your help.',
    date: 'Apr 21, 2026',
    read: false,
  },
  {
    id: '2',
    from: 'Rivka Klein',
    email: 'rivka.k@example.com',
    role: 'Shadchan',
    subject: 'Issue with match suggestions',
    body: 'I\'m having trouble viewing the match suggestions for one of my singles. The page shows an error when I click on Suggestions. Could you please look into this?',
    date: 'Apr 21, 2026',
    read: false,
  },
  {
    id: '3',
    from: 'Rachel Weiss',
    email: 'r.weiss@example.com',
    role: 'Parent',
    subject: 'Profile not showing in search',
    body: 'My daughter\'s profile doesn\'t seem to be appearing in search results. We checked all the settings and everything looks correct. Please advise.',
    date: 'Apr 19, 2026',
    read: true,
  },
  {
    id: '4',
    from: 'Shmuel Katz',
    email: 's.katz@example.com',
    role: 'Shadchan',
    subject: 'Billing question',
    body: 'I was charged twice for my monthly subscription in April. Can you please look into this and issue a refund for the duplicate charge? My account email is s.katz@example.com.',
    date: 'Apr 18, 2026',
    read: true,
  },
  {
    id: '5',
    from: 'Devorah Blum',
    email: 'd.blum@example.com',
    role: 'Advocate',
    subject: 'Unable to access advocate features',
    body: 'Since yesterday I\'ve been unable to access the advocacy features in my account. When I click on Advocacy it redirects me to the home page. Please help.',
    date: 'Apr 17, 2026',
    read: true,
  },
  {
    id: '6',
    from: 'Moshe Greenberg',
    email: 'm.greenberg@example.com',
    role: 'Shadchan',
    subject: 'Feature request: bulk messaging',
    body: 'Would it be possible to add a bulk messaging feature so I can notify multiple singles at once about upcoming events? This would save me a lot of time.',
    date: 'Apr 15, 2026',
    read: true,
  },
]

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState(initialMessages)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [viewingId, setViewingId] = useState<string | null>(null)
  const [replyingId, setReplyingId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)

  const filtered = messages.filter((m) => {
    const matchSearch =
      m.from.toLowerCase().includes(search.toLowerCase()) ||
      m.subject.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || !m.read
    return matchSearch && matchFilter
  })

  const unreadCount = messages.filter((m) => !m.read).length
  const viewing = messages.find((m) => m.id === viewingId)
  const replying = messages.find((m) => m.id === replyingId)

  function openMessage(id: string) {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, read: true } : m)))
    setViewingId(id)
  }

  async function handleSendReply() {
    if (!replyText.trim()) return
    setSending(true)
    await new Promise((r) => setTimeout(r, 600))
    setSending(false)
    setReplyText('')
    setReplyingId(null)
  }

  return (
    <AppLayout navItems={navItems} title="Messages" role="platform_admin">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#888888]" />
          <Input
            placeholder="Search messages..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1 border border-gray-200 rounded-lg p-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filter === 'all' ? 'bg-brand-maroon text-white' : 'text-[#555555] hover:bg-gray-100'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filter === 'unread' ? 'bg-brand-maroon text-white' : 'text-[#555555] hover:bg-gray-100'
            }`}
          >
            Unread
            {unreadCount > 0 && (
              <span className="ml-1.5 bg-red-100 text-red-600 text-xs font-bold px-1 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="table-th w-8"></th>
                <th className="table-th">From</th>
                <th className="table-th">Role</th>
                <th className="table-th">Subject</th>
                <th className="table-th">Date</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id} className={`table-row ${!m.read ? 'bg-blue-50/40' : ''}`}>
                  <td className="table-td">
                    {m.read
                      ? <MailOpen className="h-4 w-4 text-gray-400" />
                      : <Mail className="h-4 w-4 text-brand-maroon" />
                    }
                  </td>
                  <td className="table-td">
                    <div>
                      <p className={`${!m.read ? 'font-semibold text-[#1A1A1A]' : 'font-medium text-[#1A1A1A]'}`}>
                        {m.from}
                      </p>
                      <p className="text-xs text-[#888888]">{m.email}</p>
                    </div>
                  </td>
                  <td className="table-td text-[#555555] text-xs">{m.role}</td>
                  <td className="table-td">
                    <p className={`truncate max-w-[240px] ${!m.read ? 'font-medium text-[#1A1A1A]' : 'text-[#555555]'}`}>
                      {m.subject}
                    </p>
                    <p className="text-xs text-[#888888] truncate max-w-[240px]">{m.body.slice(0, 60)}…</p>
                  </td>
                  <td className="table-td text-[#555555] whitespace-nowrap">{m.date}</td>
                  <td className="table-td">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1"
                        onClick={() => openMessage(m.id)}
                      >
                        Read
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="gap-1"
                        onClick={() => { setReplyingId(m.id); setReplyText('') }}
                      >
                        <Reply className="h-3.5 w-3.5" />
                        Reply
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="table-td text-center text-[#888888] py-8">
                    No messages found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Message Dialog */}
      <Dialog open={viewingId !== null} onOpenChange={(open) => { if (!open) setViewingId(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewing?.subject}</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-2 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div>
                <span className="font-medium text-[#1A1A1A]">{viewing?.from}</span>
                <span className="text-[#888888] ml-2">&lt;{viewing?.email}&gt;</span>
              </div>
              <span className="text-xs text-[#888888]">{viewing?.date}</span>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
              <p className="text-sm text-[#1A1A1A] leading-relaxed whitespace-pre-wrap">{viewing?.body}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setViewingId(null)}>Close</Button>
            <Button
              className="gap-1.5"
              onClick={() => {
                setViewingId(null)
                if (viewing) { setReplyingId(viewing.id); setReplyText('') }
              }}
            >
              <Reply className="h-3.5 w-3.5" />
              Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reply Dialog */}
      <Dialog open={replyingId !== null} onOpenChange={(open) => { if (!open) setReplyingId(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Reply to {replying?.from}</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-2 space-y-4">
            <div>
              <Label className="field-label">To</Label>
              <Input value={replying?.email ?? ''} readOnly className="input-base bg-gray-50" />
            </div>
            <div>
              <Label className="field-label">Subject</Label>
              <Input value={`Re: ${replying?.subject ?? ''}`} readOnly className="input-base bg-gray-50" />
            </div>
            <div>
              <Label className="field-label">Message</Label>
              <Textarea
                rows={5}
                placeholder="Write your reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="input-base"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setReplyingId(null)}>Cancel</Button>
            <Button
              loading={sending}
              loadingText="Sending…"
              disabled={!replyText.trim()}
              onClick={handleSendReply}
            >
              Send Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
