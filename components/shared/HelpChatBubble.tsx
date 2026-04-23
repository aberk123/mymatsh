'use client'

import { useState, useCallback } from 'react'
import { MessageCircle } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { HelpChatPanel } from './HelpChatPanel'
import type { ChatMessage } from './HelpChatPanel'

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hi! I'm the MyMatSH Help Assistant. I can help you with anything related to using the platform — adding singles, managing matches, importing data, using labels, navigating the dashboard, and more. What can I help you with?",
}

interface HelpChatBubbleProps {
  role: string
}

export function HelpChatBubble({ role }: HelpChatBubbleProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [hasOpened, setHasOpened] = useState(false)
  const [hasUnread, setHasUnread] = useState(true)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [input, setInput] = useState('')

  const open = useCallback(() => {
    setIsOpen(true)
    setHasUnread(false)
    if (!hasOpened) {
      setHasOpened(true)
      setMessages([WELCOME_MESSAGE])
    }
  }, [hasOpened])

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isTyping) return

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    try {
      const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }))

      const res = await fetch('/api/chat/help', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          currentUrl: pathname ?? 'unknown',
          userRole: role,
        }),
      })

      if (!res.ok) throw new Error('API error')

      const data = await res.json() as { message: string }

      setMessages(prev => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: data.message },
      ])
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
        },
      ])
    } finally {
      setIsTyping(false)
    }
  }, [isTyping, messages, pathname, role])

  return (
    <>
      {/* Floating bubble */}
      <button
        onClick={open}
        className={[
          'fixed bottom-6 right-6 z-50',
          'w-14 h-14 rounded-full bg-brand-maroon text-white',
          'flex items-center justify-center',
          'shadow-lg hover:opacity-90 transition-opacity',
          isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100',
        ].join(' ')}
        aria-label="Open help chat"
      >
        <MessageCircle className="h-6 w-6" />
        {hasUnread && (
          <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-white" />
        )}
      </button>

      <HelpChatPanel
        isOpen={isOpen}
        messages={messages}
        isTyping={isTyping}
        input={input}
        onInputChange={setInput}
        onSend={sendMessage}
        onClose={close}
      />
    </>
  )
}
