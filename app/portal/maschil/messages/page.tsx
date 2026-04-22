'use client'

import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  HelpCircle,
  MessageSquare,
  Send,
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/ui/empty-state'
import type { NavItem } from '@/components/ui/sidebar'
import { createClient } from '@/lib/supabase/client'

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/portal/maschil', icon: LayoutDashboard },
  { label: 'Profile Questions', href: '/portal/maschil/questions', icon: HelpCircle },
  { label: 'Messages', href: '/portal/maschil/messages', icon: MessageSquare },
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

export default function MaschiMessagesPage() {
  const [loading, setLoading] = useState(true)
  const [myUserId, setMyUserId] = useState('')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activePartnerId, setActivePartnerId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

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

      const convList: Conversation[] = []
      for (const [partnerId, msgs] of Array.from(partnerMap.entries())) {
        // Try shadchan_profiles first, then fall back to users email
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: sp } = await (supabase.from('shadchan_profiles') as any)
          .select('full_name')
          .eq('user_id', partnerId)
          .maybeSingle() as { data: { full_name: string } | null }

        convList.push({
          partnerId,
          partnerName: sp?.full_name ?? 'Unknown',
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
      <AppLayout navItems={navItems} title="Messages" role="maschil">
        <div className="flex items-center justify-center py-24 text-[#888888] text-sm">Loading…</div>
      </AppLayout>
    )
  }

  if (conversations.length === 0) {
    return (
      <AppLayout navItems={navItems} title="Messages" role="maschil">
        <EmptyState message="No messages yet." />
      </AppLayout>
    )
  }

  return (
    <AppLayout navItems={navItems} title="Messages" role="maschil">
      <div className="card p-0 overflow-hidden flex h-[calc(100vh-10rem)]">
        <div className="w-72 flex-shrink-0 border-e border-gray-100 flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-[#1A1A1A]">Inbox</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.map((conv) => {
              const lastMsg = conv.messages[conv.messages.length - 1]
              return (
                <button
                  key={conv.partnerId}
                  onClick={() => handleSelectConversation(conv.partnerId)}
                  className={`w-full text-start px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50 ${
                    activePartnerId === conv.partnerId ? 'bg-[#F8F0F5]' : ''
                  }`}
                >
                  <Avatar name={conv.partnerName} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-sm font-semibold text-[#1A1A1A] truncate">{conv.partnerName}</p>
                      <span className="text-xs text-[#888888] flex-shrink-0">
                        {new Date(lastMsg.created_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric',
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-[#555555] truncate mt-0.5">{lastMsg.body}</p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="flex-shrink-0 bg-brand-pink text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {conv.unreadCount}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {activeConv && (
          <div className="flex-1 flex flex-col">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
              <Avatar name={activeConv.partnerName} size="sm" />
              <p className="font-semibold text-[#1A1A1A] text-sm">{activeConv.partnerName}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activeConv.messages.map((msg) => {
                const fromMe = msg.from_user_id === myUserId
                return (
                  <div key={msg.id} className={`flex ${fromMe ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm ${
                        fromMe
                          ? 'bg-brand-maroon text-white rounded-br-sm'
                          : 'bg-gray-100 text-[#1A1A1A] rounded-bl-sm'
                      }`}
                    >
                      <p>{msg.body}</p>
                      <p className={`text-xs mt-1 ${fromMe ? 'text-white/70' : 'text-[#888888]'}`}>
                        {new Date(msg.created_at).toLocaleTimeString('en-US', {
                          hour: 'numeric', minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="p-3 border-t border-gray-100 flex gap-2 items-end">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type your message..."
                rows={2}
                className="input-base resize-none flex-1 text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
              />
              <Button
                variant="primary"
                size="icon"
                onClick={handleSend}
                disabled={!draft.trim()}
                className="flex-shrink-0 mb-0.5"
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
