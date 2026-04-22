'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'
import { SignUpModal } from '@/components/shared/signup-modal'

export default function LandingPage() {
  const [signupOpen, setSignupOpen] = useState(false)

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

      <section
        className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at 60% 40%, #5a1040 0%, #3D0D2B 60%, #2a0820 100%)' }}
      >
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, #fff 1px, transparent 1px),
              radial-gradient(circle at 75% 75%, #fff 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative z-10 flex flex-col items-center gap-8">
          <div className="flex flex-col items-center">
            <span className="logo-my text-xl">my</span>
            <span className="logo-matsh" style={{ fontSize: '5rem' }}>matSH</span>
          </div>

          <p className="text-white/70 text-xs tracking-[0.3em] uppercase font-medium max-w-md">
            Streamlining the Sacred Work of Making Shidduchim
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
            <Link href="/login">
              <Button variant="primary" size="lg" className="w-48">
                Login
              </Button>
            </Link>
            <Button
              variant="secondary"
              size="lg"
              className="w-48 border-white/40 text-white hover:bg-white/10 bg-transparent"
              onClick={() => setSignupOpen(true)}
            >
              Sign Up
            </Button>
            <Link href="/login?type=org">
              <Button
                variant="ghost"
                size="lg"
                className="w-48 border border-brand-pink/50 text-brand-pink hover:bg-brand-pink/10 bg-transparent"
              >
                Organization Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <SignUpModal open={signupOpen} onClose={() => setSignupOpen(false)} />
    </>
  )
}
