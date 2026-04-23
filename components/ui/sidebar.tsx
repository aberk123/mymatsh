'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Logo } from './logo'
import { Mail, LogOut, type LucideIcon } from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  badge?: string
  children?: NavItem[]
}

interface SidebarProps {
  navItems: NavItem[]
  className?: string
}

export function Sidebar({ navItems, className }: SidebarProps) {
  const pathname = usePathname()

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <aside
      className={cn(
        'hidden md:flex fixed inset-y-0 start-0 z-40 flex-col bg-white shadow-sidebar',
        className
      )}
      style={{ width: 'var(--sidebar-width)' }}
    >
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-100">
        <Logo variant="sidebar" />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5">
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} />
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-gray-100 py-3 space-y-0.5">
        <Link
          href="/contact"
          className="nav-item"
        >
          <Mail className="h-4 w-4 flex-shrink-0" />
          Contact Us
        </Link>
        <form action="/auth/signout" method="POST">
          <button type="submit" className="nav-item w-full text-start">
            <LogOut className="h-4 w-4 flex-shrink-0" />
            Log out
          </button>
        </form>
      </div>
    </aside>
  )
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={active ? 'nav-item-active' : 'nav-item'}
    >
      <item.icon className="h-4 w-4 flex-shrink-0" />
      <span className="flex-1">{item.label}</span>
      {item.badge && (
        <span className="text-xs bg-brand-pink text-white rounded-full px-1.5 py-0.5 leading-none">
          {item.badge}
        </span>
      )}
    </Link>
  )
}
