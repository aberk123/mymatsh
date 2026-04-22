import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: {
    default: 'MyMatSH — Shidduch Platform',
    template: '%s | MyMatSH',
  },
  description:
    'The professional platform for Shadchanim and singles in the Orthodox Jewish community. Streamlining the sacred work of making Shidduchim.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  )
}
