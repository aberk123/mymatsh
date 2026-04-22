import { Logo } from '@/components/ui/logo'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: 'radial-gradient(ellipse at 60% 40%, #5a1040 0%, #3D0D2B 60%, #2a0820 100%)' }}
    >
      <div className="mb-8 text-center">
        <Logo variant="light" href="/" />
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
