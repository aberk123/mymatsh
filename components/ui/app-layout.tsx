import { Sidebar, type NavItem } from './sidebar'
import { Topbar } from './topbar'
import { type UserRole } from '@/types/database'
import { cn } from '@/lib/utils'

interface AppLayoutProps {
  navItems: NavItem[]
  title: string
  role: UserRole
  topbarChildren?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function AppLayout({
  navItems,
  title,
  role,
  topbarChildren,
  children,
  className,
}: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-app-bg">
      <Sidebar navItems={navItems} />
      <Topbar title={title} role={role}>
        {topbarChildren}
      </Topbar>
      <main
        className={cn('pt-16 min-h-screen', className)}
        style={{ paddingInlineStart: 'var(--sidebar-width)' }}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
