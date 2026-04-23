'use client'

import { useEffect, useRef } from 'react'
import { X, Send } from 'lucide-react'
import { HelpChatMessage } from './HelpChatMessage'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface HelpChatPanelProps {
  isOpen: boolean
  messages: ChatMessage[]
  isTyping: boolean
  input: string
  onInputChange: (val: string) => void
  onSend: (text: string) => void
  onClose: () => void
}

function TypingIndicator() {
  return (
    <div className="flex gap-2.5 items-start">
      <div className="w-7 h-7 flex-shrink-0 rounded-full bg-brand-maroon flex items-center justify-center text-white text-[11px] font-bold mt-0.5 select-none">
        M
      </div>
      <div className="bg-[#F3F3F3] rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1.5 items-center">
          <span
            className="w-2 h-2 rounded-full bg-[#AAAAAA] animate-bounce"
            style={{ animationDelay: '0ms', animationDuration: '1s' }}
          />
          <span
            className="w-2 h-2 rounded-full bg-[#AAAAAA] animate-bounce"
            style={{ animationDelay: '160ms', animationDuration: '1s' }}
          />
          <span
            className="w-2 h-2 rounded-full bg-[#AAAAAA] animate-bounce"
            style={{ animationDelay: '320ms', animationDuration: '1s' }}
          />
        </div>
      </div>
    </div>
  )
}

export function HelpChatPanel({
  isOpen,
  messages,
  isTyping,
  input,
  onInputChange,
  onSend,
  onClose,
}: HelpChatPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Scroll to bottom when messages change or typing starts
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 320)
      return () => clearTimeout(t)
    }
  }, [isOpen])

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend(input)
    }
  }

  return (
    <>
      {/* Backdrop — mobile only, tapping closes panel */}
      <div
        className={[
          'fixed inset-0 z-40 bg-black/20 sm:hidden',
          'transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
        ].join(' ')}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={[
          'fixed top-0 right-0 bottom-0 z-50',
          // Mobile: full-screen; desktop: 380px
          'w-full sm:w-[380px]',
          'flex flex-col bg-white',
          'shadow-2xl border-l border-gray-100',
          'transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
        role="dialog"
        aria-label="MyMatSH Help"
        aria-modal="true"
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-brand-maroon flex items-center justify-center text-white text-sm font-bold select-none">
              M
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1A1A1A] leading-tight">MyMatSH Help</p>
              <p className="text-[11px] text-[#888888] leading-tight">Powered by AI</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-[#888888] hover:text-[#1A1A1A] transition-colors"
            aria-label="Close help chat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Message list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5">
          {messages.map(msg => (
            <HelpChatMessage key={msg.id} role={msg.role} content={msg.content} />
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="px-3 py-3 border-t border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2 bg-[#F3F3F3] rounded-2xl pl-4 pr-2 py-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => onInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question…"
              disabled={isTyping || !isOpen}
              className="flex-1 bg-transparent text-sm text-[#1A1A1A] placeholder-[#BBBBBB] outline-none min-w-0 disabled:cursor-not-allowed"
              autoComplete="off"
            />
            <button
              onClick={() => onSend(input)}
              disabled={!input.trim() || isTyping}
              className="w-7 h-7 rounded-full bg-brand-maroon text-white flex items-center justify-center flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              aria-label="Send message"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-[10px] text-center text-[#CCCCCC] mt-1.5 select-none">
            Platform usage help only
          </p>
        </div>
      </div>
    </>
  )
}
