import { HelpChatBubble } from '@/components/shared/HelpChatBubble'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <HelpChatBubble role="shadchan" />
    </>
  )
}
