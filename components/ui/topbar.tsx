import { RoleBadge } from './badge'
import { Button } from './button'
import { type UserRole } from '@/types/database'

interface TopbarProps {
  title: string
  role: UserRole
  children?: React.ReactNode
}

export function Topbar({ title, role, children }: TopbarProps) {
  return (
    <header
      className="fixed top-0 end-0 z-30 flex items-center bg-white border-b border-gray-100 px-6"
      style={{
        insetInlineStart: 'var(--sidebar-width)',
        height: 'var(--topbar-height)',
      }}
    >
      {/* Left slot */}
      <div className="flex-1 flex items-center gap-3">{children}</div>

      {/* Centered title */}
      <h1 className="absolute left-1/2 -translate-x-1/2 text-base font-bold text-[#1A1A1A] whitespace-nowrap">
        {title}
      </h1>

      {/* Right: Tour + Role badge */}
      <div className="flex-1 flex items-center justify-end gap-3">
        <Button variant="outline-maroon" size="sm">
          Take The Tour
        </Button>
        <RoleBadge role={role} />
      </div>
    </header>
  )
}
