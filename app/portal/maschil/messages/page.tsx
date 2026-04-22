'use client'

import { useState } from 'react'
import {
  LayoutDashboard,
  HelpCircle,
  MessageSquare,
  Send,
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import type { NavItem } from '@/components/ui/sidebar'

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/portal/maschil', icon: LayoutDashboard },
  { label: 'Profile Questions', href: '/portal/maschil/questions', icon: HelpCircle },
  { label: 'Messages', href: '/portal/maschil/messages', icon: MessageSquare },
]

const conversations = [
  {
    id: '1',
    name: 'Mrs. Goldberg',
    role: 'Shadchan',
    lastMessage: 'Thank you for the question suggestion, Rabbi.',
    time: '10:30 AM',
    unread: 1,
    messages: [
      { id: 1, from: 'them', text: 'Rabbi Friedman, we have been using your questions with our singles.', time: '9:00 AM' },
      { id: 2, from: 'me', text: 'Wonderful! I am glad they are finding it helpful.', time: '9:45 AM' },
      { id: 3, from: 'them', text: 'Thank you for the question suggestion, Rabbi.', time: '10:30 AM' },
    ],
  },
  {
    id: '2',
    name: 'Admin Team',
    role: 'Platform',
    lastMessage: 'New question submissions are pending review.',
    time: 'Yesterday',
    unread: 0,
    messages: [
      { id: 1, from: 'them', text: 'New question submissions are pending review.', time: 'Yesterday' },
    ],
  },
]

export default function MaschiMessagesPage() {
  const [activeId, setActiveId] = useState(conversations[0].id)
  const [draft, setDraft] = useState('')

  const active = conversations.find((c) => c.id === activeId)!

  function send() {
    if (!draft.trim()) return
    setDraft('')
  }

  return (
    <AppLayout navItems={navItems} title="Messages" role="maschil">
      <div className="flex gap-0 h-[calc(100vh-var(--topbar-height)-3rem)] rounded-xl overflow-hidden shadow-card">
        {/* Conversation list */}
        <div className="w-64 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-[#1A1A1A]">Inbox</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <EmptyState message="No messages yet." />
            ) : (
              conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={`w-full text-start px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${activeId === c.id ? 'bg-[#F8F0F5]' : ''}`}
                >
                  <div className="flex items-start gap-2.5">
                    <Avatar name={c.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-[#1A1A1A] truncate">{c.name}</p>
                        <span className="text-[10px] text-[#888888] flex-shrink-0 ms-1">{c.time}</span>
                      </div>
                      <p className="text-[11px] text-[#888888] truncate mt-0.5">{c.lastMessage}</p>
                    </div>
                    {c.unread > 0 && (
                      <span className="flex-shrink-0 w-4 h-4 rounded-full bg-brand-pink text-white text-[10px] flex items-center justify-center font-bold">
                        {c.unread}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Thread */}
        <div className="flex-1 bg-white flex flex-col">
          {/* Thread header */}
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100">
            <Avatar name={active.name} size="sm" />
            <div>
              <p className="text-sm font-semibold text-[#1A1A1A]">{active.name}</p>
              <p className="text-xs text-[#888888]">{active.role}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {active.messages.map((m) => (
              <div key={m.id} className={`flex ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                    m.from === 'me'
                      ? 'bg-brand-maroon text-white rounded-br-sm'
                      : 'bg-gray-100 text-[#1A1A1A] rounded-bl-sm'
                  }`}
                >
                  <p>{m.text}</p>
                  <p className={`text-[10px] mt-1 ${m.from === 'me' ? 'text-white/60' : 'text-[#888888]'}`}>
                    {m.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Compose */}
          <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-3">
            <input
              className="flex-1 input-base"
              placeholder="Type a message..."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            />
            <Button onClick={send} size="icon" disabled={!draft.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
