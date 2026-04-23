'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Heart, MessageSquare, MoreHorizontal,
  CalendarCheck, UsersRound, UserCircle, Mail, LogOut, X,
} from 'lucide-react'
import { useUnreadMessageCount } from '@/lib/use-unread-messages'
import { cn } from '@/lib/utils'

const PRIMARY = [
  { label: 'Home',     href: '/dashboard',         icon: LayoutDashboard },
  { label: 'Singles',  href: '/dashboard/singles',  icon: Users },
  { label: 'Matches',  href: '/dashboard/matches',  icon: Heart },
  { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
]

const MORE = [
  { label: 'Calendar',   href: '/dashboard/tasks',   icon: CalendarCheck },
  { label: 'Groups',     href: '/dashboard/groups',  icon: UsersRound },
  { label: 'My Profile', href: '/dashboard/profile', icon: UserCircle },
]

export function MobileBottomNav() {
  const pathname = usePathname()
  const unread = useUnreadMessageCount()
  const [moreOpen, setMoreOpen] = useState(false)

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <>
      {/* Backdrop */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {/* More drawer */}
      <div
        className={cn(
          'fixed inset-x-0 bottom-16 z-50 bg-white rounded-t-2xl shadow-2xl border-t border-gray-100 transition-transform duration-300 md:hidden',
          moreOpen ? 'translate-y-0' : 'translate-y-full pointer-events-none'
        )}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <span className="text-sm font-semibold text-[#1A1A1A]">More</span>
          <button
            onClick={() => setMoreOpen(false)}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5 text-[#555555]" />
          </button>
        </div>
        <div className="py-1 pb-safe">
          {MORE.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMoreOpen(false)}
              className={cn(
                'flex items-center gap-4 px-5 py-4 text-sm font-medium min-h-[56px] transition-colors',
                isActive(item.href)
                  ? 'text-brand-maroon bg-[#F8F0F5]'
                  : 'text-[#555555] hover:bg-gray-50'
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {item.label}
            </Link>
          ))}
          <div className="border-t border-gray-100 mt-1 pt-1">
            <Link
              href="/contact"
              onClick={() => setMoreOpen(false)}
              className="flex items-center gap-4 px-5 py-4 text-sm font-medium text-[#555555] min-h-[56px]"
            >
              <Mail className="h-5 w-5 flex-shrink-0" />
              Contact Us
            </Link>
            <form action="/auth/signout" method="POST">
              <button
                type="submit"
                className="w-full flex items-center gap-4 px-5 py-4 text-sm font-medium text-[#555555] min-h-[56px]"
              >
                <LogOut className="h-5 w-5 flex-shrink-0" />
                Log Out
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom nav bar */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 flex md:hidden safe-area-inset-bottom">
        {PRIMARY.map((item) => {
          const active = isActive(item.href)
          const isMessages = item.href === '/dashboard/messages'
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-h-[56px] text-[11px] font-medium transition-colors',
                active ? 'text-brand-maroon' : 'text-[#888888]'
              )}
            >
              <div className="relative">
                <item.icon className="h-6 w-6" />
                {isMessages && unread > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-brand-pink text-white rounded-full min-w-[16px] h-4 flex items-center justify-center font-bold leading-none text-[9px] px-0.5">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </div>
              <span>{item.label}</span>
            </Link>
          )
        })}
        <button
          onClick={() => setMoreOpen(prev => !prev)}
          className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-h-[56px] text-[11px] font-medium text-[#888888]"
        >
          <MoreHorizontal className="h-6 w-6" />
          <span>More</span>
        </button>
      </nav>
    </>
  )
}
