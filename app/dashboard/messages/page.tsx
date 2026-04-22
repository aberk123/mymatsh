'use client'

import { useState } from 'react'
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
import type { NavItem } from '@/components/ui/sidebar'

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'My Singles', href: '/dashboard/singles', icon: Users },
  { label: 'Suggestions', href: '/dashboard/matches', icon: Heart },
  { label: 'Calendar', href: '/dashboard/tasks', icon: CalendarCheck },
  { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare, badge: '3' },
  { label: 'Groups', href: '/dashboard/groups', icon: UsersRound },
  { label: 'My Profile', href: '/dashboard/profile', icon: UserCircle },
]

interface Conversation {
  id: string
  name: string
  lastMessage: string
  time: string
  unread: number
}

interface Message {
  id: string
  text: string
  outgoing: boolean
  time: string
}

const conversations: Conversation[] = [
  { id: '1', name: 'Yosef Goldstein',   lastMessage: 'Thank you for the update!',           time: '10:32 AM', unread: 2 },
  { id: '2', name: 'Devorah Friedman',  lastMessage: "I'll let my parents know.",            time: '9:15 AM',  unread: 1 },
  { id: '3', name: 'Rabbi Stein',       lastMessage: 'Can we speak tomorrow evening?',       time: 'Yesterday', unread: 0 },
  { id: '4', name: 'Mrs. Blum',         lastMessage: 'Rivka would like to proceed.',         time: 'Yesterday', unread: 0 },
  { id: '5', name: 'Menachem Katz',     lastMessage: 'Looking forward to hearing back.',     time: 'Apr 19',   unread: 0 },
]

const threadsByConversation: Record<string, Message[]> = {
  '1': [
    { id: 'm1', text: 'Hello Mrs. Kessler, I was hoping to hear an update on the suggestion.',                           outgoing: false, time: '10:15 AM' },
    { id: 'm2', text: "Hi Yosef! Yes — Devorah's family is very interested. They would like to proceed to a phone call.", outgoing: true,  time: '10:20 AM' },
    { id: 'm3', text: "That's wonderful news! When would be a good time?",                                                outgoing: false, time: '10:24 AM' },
    { id: 'm4', text: 'They suggested Thursday evening around 8pm. Does that work for you?',                              outgoing: true,  time: '10:27 AM' },
    { id: 'm5', text: 'Yes, Thursday at 8 works perfectly.',                                                              outgoing: false, time: '10:30 AM' },
    { id: 'm6', text: 'Thank you for the update!',                                                                        outgoing: false, time: '10:32 AM' },
  ],
  '2': [
    { id: 'm1', text: 'Devorah, I wanted to let you know that Yosef is very interested in continuing.',  outgoing: true,  time: '9:05 AM' },
    { id: 'm2', text: "Thank you so much, Mrs. Kessler. That's really encouraging.",                      outgoing: false, time: '9:10 AM' },
    { id: 'm3', text: 'He suggested a first meeting in Manhattan next Sunday. Would you be available?',   outgoing: true,  time: '9:12 AM' },
    { id: 'm4', text: "I'll let my parents know.",                                                        outgoing: false, time: '9:15 AM' },
  ],
  '3': [
    { id: 'm1', text: 'Rabbi Stein, thank you for your time last week.',            outgoing: true,  time: 'Yesterday 4:00 PM' },
    { id: 'm2', text: 'Of course, Mrs. Kessler. Always a pleasure.',                outgoing: false, time: 'Yesterday 4:45 PM' },
    { id: 'm3', text: 'Can we speak tomorrow evening?',                              outgoing: false, time: 'Yesterday 6:10 PM' },
  ],
  '4': [
    { id: 'm1', text: 'Good afternoon, Mrs. Blum. How is Rivka doing?',             outgoing: true,  time: 'Yesterday 2:00 PM' },
    { id: 'm2', text: 'She is doing well, thank you for asking.',                   outgoing: false, time: 'Yesterday 2:30 PM' },
    { id: 'm3', text: 'Rivka would like to proceed.',                               outgoing: false, time: 'Yesterday 2:31 PM' },
  ],
  '5': [
    { id: 'm1', text: "Hi Menachem, I have a suggestion I'd like to share with you.", outgoing: true,  time: 'Apr 19 11:00 AM' },
    { id: 'm2', text: "Of course, I'm open to hearing.",                               outgoing: false, time: 'Apr 19 11:30 AM' },
    { id: 'm3', text: 'Looking forward to hearing back.',                              outgoing: false, time: 'Apr 19 11:32 AM' },
  ],
}

export default function MessagesPage() {
  const [activeConvId, setActiveConvId] = useState('1')
  const [search, setSearch] = useState('')
  const [messageInput, setMessageInput] = useState('')
  const [threads, setThreads] = useState(threadsByConversation)

  const activeConv = conversations.find((c) => c.id === activeConvId)!
  const activeMessages = threads[activeConvId] ?? []

  const filteredConvs = conversations.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  function handleSend() {
    if (!messageInput.trim()) return
    const newMsg: Message = {
      id: `m${Date.now()}`,
      text: messageInput.trim(),
      outgoing: true,
      time: 'Just now',
    }
    setThreads((prev) => ({
      ...prev,
      [activeConvId]: [...(prev[activeConvId] ?? []), newMsg],
    }))
    setMessageInput('')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <AppLayout navItems={navItems} title="Messages" role="shadchan">
      <div className="flex h-[calc(100vh-7rem)] gap-0 rounded-xl overflow-hidden border border-gray-200 bg-white shadow-card">
        {/* Left panel: Conversation list */}
        <div className="w-1/3 border-e border-gray-200 flex flex-col">
          {/* Search */}
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

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto">
            {filteredConvs.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setActiveConvId(conv.id)}
                className={`w-full text-start px-4 py-3 border-b border-gray-50 flex items-start gap-3 transition-colors ${
                  conv.id === activeConvId ? 'bg-[#F8F0F5]' : 'hover:bg-gray-50'
                }`}
              >
                <Avatar name={conv.name} size="md" className="flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-sm font-semibold text-[#1A1A1A] truncate">{conv.name}</span>
                    <span className="text-xs text-[#888888] flex-shrink-0">{conv.time}</span>
                  </div>
                  <div className="flex items-center justify-between gap-1 mt-0.5">
                    <span className="text-xs text-[#888888] truncate">{conv.lastMessage}</span>
                    {conv.unread > 0 && (
                      <span className="flex-shrink-0 text-xs bg-brand-pink text-white rounded-full w-5 h-5 flex items-center justify-center font-medium">
                        {conv.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right panel: Message thread */}
        <div className="flex-1 flex flex-col">
          {/* Thread header */}
          <div className="px-5 py-3.5 border-b border-gray-200 flex items-center gap-3">
            <Avatar name={activeConv.name} size="sm" />
            <div>
              <p className="text-sm font-semibold text-[#1A1A1A]">{activeConv.name}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {activeMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.outgoing ? 'justify-end' : 'justify-start'}`}
              >
                {!msg.outgoing && (
                  <Avatar name={activeConv.name} size="sm" className="me-2 mt-0.5 flex-shrink-0" />
                )}
                <div className={`max-w-[70%]`}>
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.outgoing
                        ? 'bg-brand-maroon text-white rounded-br-sm'
                        : 'bg-gray-100 text-[#1A1A1A] rounded-bl-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <p className={`text-xs text-[#AAAAAA] mt-1 ${msg.outgoing ? 'text-end' : 'text-start'}`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Input area */}
          <div className="px-4 py-3 border-t border-gray-200 flex items-center gap-3">
            <input
              className="flex-1 input-base text-sm"
              placeholder="Type a message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <Button
              onClick={handleSend}
              className="btn-primary h-9 w-9 p-0 flex-shrink-0"
              disabled={!messageInput.trim()}
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
