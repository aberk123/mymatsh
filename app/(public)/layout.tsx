import Link from 'next/link'
import { Logo } from '@/components/ui/logo'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-8 py-4 bg-transparent">
        <Logo variant="light" />
        <nav className="hidden md:flex items-center gap-8">
          {[
            { label: 'HOME', href: '/' },
            { label: 'ABOUT US', href: '/about' },
            { label: 'MISSION', href: '/mission' },
            { label: 'CONTACT US', href: '/contact' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-white/80 hover:text-white text-xs font-semibold tracking-widest uppercase transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      {children}
    </>
  )
}
