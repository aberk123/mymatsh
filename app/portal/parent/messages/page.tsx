'use client'

import { useState } from 'react'
import {
  LayoutDashboard,
  UserCircle,
  Heart,
  MessageSquare,
  Send,
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar } from '@/components/ui/avatar'
import type { NavItem } from '@/components/ui/sidebar'

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/portal/parent', icon: LayoutDashboard },
  { label: 'My Child', href: '/portal/parent/child', icon: UserCircle },
  { label: 'Suggestions', href: '/portal/parent/matches', icon: Heart },
  { label: 'Messages', href: '/portal/parent/messages', icon: MessageSquare, badge: '1' },
]

interface Message {
  id: string
  from: 'me' | 'other'
  body: string
  time: string
}

interface Conversation {
  id: string
  name: string
  role: string
  lastMessage: string
  lastTime: string
  unread: number
  messages: Message[]
}

const mockConversations: Conversation[] = [
  {
    id: '1',
    name: 'Rabbi Sternberg',
    role: 'Shadchan',
    lastMessage: 'Shalom! Things are progressing well with the suggestion for Devorah.',
    lastTime: '2:14 PM',
    unread: 1,
    messages: [
      {
        id: 'm1',
        from: 'other',
        body: 'Shalom Mr. & Mrs. Cohen! I hope this message finds you well.',
        time: '10:00 AM',
      },
      {
        id: 'm2',
        from: 'me',
        body: 'Shalom Rabbi Sternberg, thank you for reaching out!',
        time: '10:30 AM',
      },
      {
        id: 'm3',
        from: 'other',
        body: 'Shalom! Things are progressing well with the suggestion for Devorah. I will keep you posted with any updates.',
        time: '2:14 PM',
      },
    ],
  },
  {
    id: '2',
    name: 'Mrs. Goldberg',
    role: 'Shadchan',
    lastMessage: 'I wanted to update you on the current suggestion.',
    lastTime: 'Yesterday',
    unread: 0,
    messages: [
      {
        id: 'm1',
        from: 'other',
        body: 'Good afternoon! I wanted to update you on the current suggestion for Devorah.',
        time: 'Yesterday 3:00 PM',
      },
      {
        id: 'm2',
        from: 'me',
        body: 'Thank you Mrs. Goldberg, please do keep us informed.',
        time: 'Yesterday 3:45 PM',
      },
    ],
  },
]

export default function ParentMessagesPage() {
  const [activeId, setActiveId] = useState(mockConversations[0].id)
  const [draft, setDraft] = useState('')
  const [conversations, setConversations] = useState(mockConversations)

  const active = conversations.find((c) => c.id === activeId)!

  function handleSelectConversation(id: string) {
    setActiveId(id)
    setDraft('')
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c))
    )
  }

  function handleSend() {
    if (!draft.trim()) return
    const newMsg: Message = {
      id: `m${Date.now()}`,
      from: 'me',
      body: draft.trim(),
      time: 'Just now',
    }
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? { ...c, messages: [...c.messages, newMsg], lastMessage: newMsg.body, lastTime: 'Just now' }
          : c
      )
    )
    setDraft('')
  }

  return (
    <AppLayout navItems={navItems} title="Messages" role="parent">
      <div className="card p-0 overflow-hidden flex h-[calc(100vh-10rem)]">
        {/* Conversation list */}
        <div className="w-72 flex-shrink-0 border-e border-gray-100 flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-[#1A1A1A]">Conversations</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => handleSelectConversation(conv.id)}
                className={`w-full text-start px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50 ${
                  activeId === conv.id ? 'bg-[#F8F0F5]' : ''
                }`}
              >
                <Avatar name={conv.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-sm font-semibold text-[#1A1A1A] truncate">{conv.name}</p>
                    <span className="text-xs text-[#888888] flex-shrink-0">{conv.lastTime}</span>
                  </div>
                  <p className="text-xs text-[#888888] truncate mt-0.5">{conv.role}</p>
                  <p className="text-xs text-[#555555] truncate mt-0.5">{conv.lastMessage}</p>
                </div>
                {conv.unread > 0 && (
                  <span className="flex-shrink-0 bg-brand-pink text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {conv.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
            <Avatar name={active.name} size="sm" />
            <div>
              <p className="font-semibold text-[#1A1A1A] text-sm">{active.name}</p>
              <p className="text-xs text-[#888888]">{active.role}</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {active.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.from === 'me' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm ${
                    msg.from === 'me'
                      ? 'bg-brand-maroon text-white rounded-br-sm'
                      : 'bg-gray-100 text-[#1A1A1A] rounded-bl-sm'
                  }`}
                >
                  <p>{msg.body}</p>
                  <p className={`text-xs mt-1 ${msg.from === 'me' ? 'text-white/70' : 'text-[#888888]'}`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
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
      </div>
    </AppLayout>
  )
}
