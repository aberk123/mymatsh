'use client'

import { useEffect, useState } from 'react'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import type { NavItem } from '@/components/ui/sidebar'
import { createClient } from '@/lib/supabase/client'

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Shadchanim', href: '/admin/shadchanim', icon: UserCheck },
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

interface Inquiry {
  id: string
  name: string
  email: string
  message: string
  created_at: string
  viewed: boolean
}

export default function AdminMessagesPage() {
  const [loading, setLoading] = useState(true)
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [viewingId, setViewingId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: rows } = await (supabase.from('contact_inquiries') as any)
        .select('id, name, email, message, created_at')
        .order('created_at', { ascending: false }) as {
          data: Array<{ id: string; name: string; email: string; message: string; created_at: string }> | null
        }

      setInquiries((rows ?? []).map((r) => ({ ...r, viewed: false })))
      setLoading(false)
    }

    load()
  }, [])

  const filtered = inquiries.filter((m) => {
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      m.message.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || !m.viewed
    return matchSearch && matchFilter
  })

  const unreadCount = inquiries.filter((m) => !m.viewed).length
  const viewing = inquiries.find((m) => m.id === viewingId)

  function openInquiry(id: string) {
    setInquiries((prev) => prev.map((m) => (m.id === id ? { ...m, viewed: true } : m)))
    setViewingId(id)
  }

  return (
    <AppLayout navItems={navItems} title="Messages" role="platform_admin">
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
        {loading ? (
          <div className="flex items-center justify-center py-24 text-[#888888] text-sm">Loading…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="table-th w-8"></th>
                  <th className="table-th">From</th>
                  <th className="table-th">Message</th>
                  <th className="table-th">Date</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.id} className={`table-row ${!m.viewed ? 'bg-blue-50/40' : ''}`}>
                    <td className="table-td">
                      {m.viewed
                        ? <MailOpen className="h-4 w-4 text-gray-400" />
                        : <Mail className="h-4 w-4 text-brand-maroon" />
                      }
                    </td>
                    <td className="table-td">
                      <div>
                        <p className={`${!m.viewed ? 'font-semibold text-[#1A1A1A]' : 'font-medium text-[#1A1A1A]'}`}>
                          {m.name}
                        </p>
                        <p className="text-xs text-[#888888]">{m.email}</p>
                      </div>
                    </td>
                    <td className="table-td">
                      <p className="text-xs text-[#888888] truncate max-w-[280px]">{m.message.slice(0, 80)}…</p>
                    </td>
                    <td className="table-td text-[#555555] whitespace-nowrap">
                      {new Date(m.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </td>
                    <td className="table-td">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1"
                        onClick={() => openInquiry(m.id)}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="table-td text-center text-[#888888] py-8">
                      {inquiries.length === 0 ? 'No contact inquiries yet.' : 'No messages match your search.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={viewingId !== null} onOpenChange={(open) => { if (!open) setViewingId(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Message from {viewing?.name}</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-2 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#888888]">{viewing?.email}</span>
              <span className="text-xs text-[#888888]">
                {viewing && new Date(viewing.created_at).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                })}
              </span>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
              <p className="text-sm text-[#1A1A1A] leading-relaxed whitespace-pre-wrap">{viewing?.message}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setViewingId(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
