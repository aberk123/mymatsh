import { Sidebar, type NavItem } from './sidebar'
import { Topbar } from './topbar'
import { MobileBottomNav } from './mobile-bottom-nav'
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
      {role === 'shadchan' && <MobileBottomNav />}
      <main
        className={cn('pt-16 min-h-screen pb-20 md:pb-0', className)}
        style={{ paddingInlineStart: 'var(--sidebar-width)' }}
      >
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  )
}
