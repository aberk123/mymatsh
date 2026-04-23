import { HelpChatBubble } from '@/components/shared/HelpChatBubble'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <HelpChatBubble role="platform_admin" />
    </>
  )
}
