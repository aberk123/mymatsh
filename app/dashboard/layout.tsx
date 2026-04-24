import type { Metadata } from 'next'
import { HelpChatBubble } from '@/components/shared/HelpChatBubble'

export const metadata: Metadata = {
  robots: { index: false, follow: false, noarchive: true, nosnippet: true },
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <HelpChatBubble role="shadchan" />
    </>
  )
}
