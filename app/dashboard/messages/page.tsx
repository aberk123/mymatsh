'use client'

import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  Users,
  Heart,
  CalendarCheck,
  MessageSquare,
  UsersRound,
  UserCircle,
  Send,
  Search,
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { Avatar } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import type { NavItem } from '@/components/ui/sidebar'
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

interface MessageRow {
  id: string
  from_user_id: string
  to_user_id: string
  body: string
  is_read: boolean
  created_at: string
}

interface Conversation {
  partnerId: string
  partnerName: string
  messages: MessageRow[]
  unreadCount: number
}

export default function MessagesPage() {
  const [loading, setLoading] = useState(true)
  const [myUserId, setMyUserId] = useState('')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activePartnerId, setActivePartnerId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setMyUserId(user.id)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: rows } = await (supabase.from('messages') as any)
        .select('id, from_user_id, to_user_id, body, is_read, created_at')
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
        .order('created_at', { ascending: true }) as { data: MessageRow[] | null }

      if (!rows || rows.length === 0) { setLoading(false); return }

      const partnerMap = new Map<string, MessageRow[]>()
      for (const msg of rows) {
        const partnerId = msg.from_user_id === user.id ? msg.to_user_id : msg.from_user_id
        if (!partnerMap.has(partnerId)) partnerMap.set(partnerId, [])
        partnerMap.get(partnerId)!.push(msg)
      }

      // Resolve partner names — could be parents, singles, or admins
      const convList: Conversation[] = []
      for (const [partnerId, msgs] of Array.from(partnerMap.entries())) {
        // Try users table for email as fallback name
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: userRow } = await (supabase.from('users') as any)
          .select('email, role')
          .eq('id', partnerId)
          .maybeSingle() as { data: { email: string | null; role: string } | null }

        let partnerName = userRow?.email ?? 'Unknown'

        // Try to get a better name based on role
        if (userRow?.role === 'parent') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: parent } = await (supabase.from('parents') as any)
            .select('full_name')
            .eq('user_id', partnerId)
            .maybeSingle() as { data: { full_name: string } | null }
          if (parent?.full_name) partnerName = parent.full_name
        } else if (userRow?.role === 'single') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: single } = await (supabase.from('singles') as any)
            .select('first_name, last_name')
            .eq('user_id', partnerId)
            .maybeSingle() as { data: { first_name: string; last_name: string } | null }
          if (single) partnerName = `${single.first_name} ${single.last_name}`.trim()
        } else if (userRow?.role === 'advocate') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: advocate } = await (supabase.from('advocates') as any)
            .select('full_name')
            .eq('user_id', partnerId)
            .maybeSingle() as { data: { full_name: string } | null }
          if (advocate?.full_name) partnerName = advocate.full_name
        }

        convList.push({
          partnerId,
          partnerName,
          messages: msgs,
          unreadCount: msgs.filter((m) => !m.is_read && m.to_user_id === user.id).length,
        })
      }

      setConversations(convList)
      if (convList.length > 0) setActivePartnerId(convList[0].partnerId)
      setLoading(false)
    }

    load()
  }, [])

  const filteredConvs = conversations.filter((c) =>
    c.partnerName.toLowerCase().includes(search.toLowerCase())
  )

  const activeConv = conversations.find((c) => c.partnerId === activePartnerId)

  function handleSelectConversation(partnerId: string) {
    setActivePartnerId(partnerId)
    setDraft('')
    setConversations((prev) =>
      prev.map((c) => (c.partnerId === partnerId ? { ...c, unreadCount: 0 } : c))
    )
  }

  async function handleSend() {
    if (!draft.trim() || !activePartnerId || !myUserId) return
    const body = draft.trim()
    setDraft('')

    const supabase = createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newMsg } = await (supabase.from('messages') as any)
      .insert({ from_user_id: myUserId, to_user_id: activePartnerId, body, is_read: false })
      .select()
      .single() as { data: MessageRow | null }

    if (newMsg) {
      setConversations((prev) =>
        prev.map((c) =>
          c.partnerId === activePartnerId
            ? { ...c, messages: [...c.messages, newMsg] }
            : c
        )
      )
    }
  }

  if (loading) {
    return (
      <AppLayout navItems={navItems} title="Messages" role="shadchan">
        <div className="flex items-center justify-center py-24 text-[#888888] text-sm">Loading…</div>
      </AppLayout>
    )
  }

  if (conversations.length === 0) {
    return (
      <AppLayout navItems={navItems} title="Messages" role="shadchan">
        <EmptyState message="No messages yet." />
      </AppLayout>
    )
  }

  return (
    <AppLayout navItems={navItems} title="Messages" role="shadchan">
      <div className="flex h-[calc(100vh-7rem)] gap-0 rounded-xl overflow-hidden border border-gray-200 bg-white shadow-card">
        <div className="w-1/3 border-e border-gray-200 flex flex-col">
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#888888]" />
              <Input
                className="input-base ps-9 text-sm"
                placeholder="Search conversations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredConvs.map((conv) => {
              const lastMsg = conv.messages[conv.messages.length - 1]
              return (
                <button
                  key={conv.partnerId}
                  onClick={() => handleSelectConversation(conv.partnerId)}
                  className={`w-full text-start px-4 py-3 border-b border-gray-50 flex items-start gap-3 transition-colors ${
                    conv.partnerId === activePartnerId ? 'bg-[#F8F0F5]' : 'hover:bg-gray-50'
                  }`}
                >
                  <Avatar name={conv.partnerName} size="md" className="flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-sm font-semibold text-[#1A1A1A] truncate">{conv.partnerName}</span>
                      <span className="text-xs text-[#888888] flex-shrink-0">
                        {new Date(lastMsg.created_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-1 mt-0.5">
                      <span className="text-xs text-[#888888] truncate">{lastMsg.body}</span>
                      {conv.unreadCount > 0 && (
                        <span className="flex-shrink-0 text-xs bg-brand-pink text-white rounded-full w-5 h-5 flex items-center justify-center font-medium">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {activeConv && (
          <div className="flex-1 flex flex-col">
            <div className="px-5 py-3.5 border-b border-gray-200 flex items-center gap-3">
              <Avatar name={activeConv.partnerName} size="sm" />
              <p className="text-sm font-semibold text-[#1A1A1A]">{activeConv.partnerName}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {activeConv.messages.map((msg) => {
                const fromMe = msg.from_user_id === myUserId
                return (
                  <div key={msg.id} className={`flex ${fromMe ? 'justify-end' : 'justify-start'}`}>
                    {!fromMe && (
                      <Avatar name={activeConv.partnerName} size="sm" className="me-2 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="max-w-[70%]">
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          fromMe
                            ? 'bg-brand-maroon text-white rounded-br-sm'
                            : 'bg-gray-100 text-[#1A1A1A] rounded-bl-sm'
                        }`}
                      >
                        {msg.body}
                      </div>
                      <p className={`text-xs text-[#AAAAAA] mt-1 ${fromMe ? 'text-end' : 'text-start'}`}>
                        {new Date(msg.created_at).toLocaleTimeString('en-US', {
                          hour: 'numeric', minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="px-4 py-3 border-t border-gray-200 flex items-center gap-3">
              <input
                className="flex-1 input-base text-sm"
                placeholder="Type a message..."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
                }}
              />
              <Button
                onClick={handleSend}
                className="btn-primary h-9 w-9 p-0 flex-shrink-0"
                disabled={!draft.trim()}
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
