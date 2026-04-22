'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { SignUpModal } from '@/components/shared/signup-modal'

export default function LandingPage() {
  const [signupOpen, setSignupOpen] = useState(false)

  return (
    <>
      {/* Hero */}
      <section
        className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at 60% 40%, #5a1040 0%, #3D0D2B 60%, #2a0820 100%)' }}
      >
        {/* Subtle geometric pattern overlay */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, #fff 1px, transparent 1px),
              radial-gradient(circle at 75% 75%, #fff 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative z-10 flex flex-col items-center gap-8">
          {/* Logo */}
          <div className="flex flex-col items-center">
            <span className="logo-my text-xl">my</span>
            <span className="logo-matsh" style={{ fontSize: '5rem' }}>matSH</span>
          </div>

          {/* Tagline */}
          <p className="text-white/70 text-xs tracking-[0.3em] uppercase font-medium max-w-md">
            Streamlining the Sacred Work of Making Shidduchim
          </p>

          {/* CTA Buttons */}
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
