'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
    } finally {
      setLoading(false)
      setSubmitted(true)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">Forgot Password</h1>

      {submitted ? (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700">
            If an account exists with that email, you&apos;ll receive a reset link shortly.
          </div>
          <Link
            href="/login"
            className="block text-center text-sm text-brand-maroon hover:underline"
          >
            Back to Sign In
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-[#555555] mb-2">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>
          <div>
            <Label htmlFor="email" required>Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            loading={loading}
            loadingText="Sending…"
          >
            Send Reset Link
          </Button>
          <p className="text-sm text-center">
            <Link href="/login" className="text-brand-maroon hover:underline">
              Back to Sign In
            </Link>
          </p>
        </form>
      )}
    </div>
  )
}
