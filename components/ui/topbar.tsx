import { RoleBadge } from './badge'
import { Button } from './button'
import { Logo } from './logo'
import { NotificationBell } from './notification-bell'
import { type UserRole } from '@/types/database'

interface TopbarProps {
  title: string
  role: UserRole
  children?: React.ReactNode
}

export function Topbar({ title, role, children }: TopbarProps) {
  return (
    <header
      className="fixed top-0 end-0 z-30 flex items-center bg-white border-b border-gray-100 px-4 md:px-6"
      style={{
        insetInlineStart: 'var(--sidebar-width)',
        height: 'var(--topbar-height)',
      }}
    >
      {/* Mobile: logo — Desktop: left slot */}
      <div className="flex-1 flex items-center gap-3">
        <div className="md:hidden">
          <Logo variant="sidebar" href="/dashboard" />
        </div>
        {children && <div className="hidden md:flex items-center gap-3">{children}</div>}
      </div>

      {/* Centered title — desktop only */}
      <h1 className="hidden md:block absolute left-1/2 -translate-x-1/2 text-base font-bold text-[#1A1A1A] whitespace-nowrap">
        {title}
      </h1>

      {/* Right: mobile = bell only; desktop = tour + bell + role */}
      <div className="flex items-center gap-2 md:gap-3">
        <Button variant="outline-maroon" size="sm" className="hidden md:inline-flex">
          Take The Tour
        </Button>
        <NotificationBell />
        <span className="hidden md:block">
          <RoleBadge role={role} />
        </span>
      </div>
    </header>
  )
}
