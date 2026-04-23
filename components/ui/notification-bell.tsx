'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface AppNotification {
  id: string
  type: string
  payload: Record<string, unknown>
  is_read: boolean
  created_at: string
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function notificationMessage(n: AppNotification): string {
  const p = n.payload
  if (typeof p.message === 'string') return p.message
  switch (n.type) {
    case 'shadchan_approved': return 'Your shadchan application has been approved'
    case 'match_suggested': return 'A new match has been suggested for you'
    case 'representation_request': return typeof p.single_name === 'string' ? `Representation request received for ${p.single_name}` : 'New representation request received'
    case 'import_batch_approved': return 'An import batch has been approved by the shadchan'
    case 'single_status_changed': return typeof p.single_name === 'string' ? `${p.single_name} status updated to ${p.new_status}` : 'A single\'s status has changed'
    default: return n.type.replace(/_/g, ' ')
  }
}

export function NotificationBell() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) setNotifications(await res.json())
    } catch { /* silently fail — non-critical */ }
  }, [])

  useEffect(() => {
    fetchNotifications()
    const id = setInterval(fetchNotifications, 60_000)
    return () => clearInterval(id)
  }, [fetchNotifications])

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen])

  const unreadCount = notifications.filter(n => !n.is_read).length

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' })
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  async function markAllRead() {
    await fetch('/api/notifications/read-all', { method: 'PATCH' })
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  async function handleClick(n: AppNotification) {
    if (!n.is_read) await markRead(n.id)
    setIsOpen(false)
    const link = typeof n.payload.link === 'string' ? n.payload.link : null
    if (link) router.push(link)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="relative flex items-center justify-center h-8 w-8 rounded-full text-[#555555] hover:text-brand-maroon hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-0.5 rounded-full bg-brand-maroon text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-[#1A1A1A]">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-brand-maroon hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[#888888]">
              No notifications yet
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto divide-y divide-gray-50">
              {notifications.map(n => (
                <li key={n.id}>
                  <button
                    onClick={() => handleClick(n)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex gap-3 ${!n.is_read ? 'bg-[#FDF8FB]' : ''}`}
                  >
                    {!n.is_read && (
                      <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-brand-maroon" />
                    )}
                    {n.is_read && <span className="mt-1.5 h-2 w-2 flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#1A1A1A] leading-snug">{notificationMessage(n)}</p>
                      <p className="text-xs text-[#888888] mt-0.5">{relativeTime(n.created_at)}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
