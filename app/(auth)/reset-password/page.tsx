'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sessionReady, setSessionReady] = useState(false)
  const [sessionError, setSessionError] = useState(false)

  useEffect(() => {
    const code = searchParams.get('code')
    if (!code) {
      setSessionError(true)
      return
    }
    const supabase = createClient()
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) setSessionError(true)
      else setSessionReady(true)
    })
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (updateError) {
      setError(updateError.message)
      return
    }
    router.push('/login?reset=1')
  }

  if (sessionError) {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          This reset link is invalid or has expired.
        </div>
        <Link
          href="/forgot-password"
          className="block text-center text-sm text-brand-maroon hover:underline"
        >
          Request a new reset link
        </Link>
      </div>
    )
  }

  if (!sessionReady) {
    return (
      <p className="text-center text-sm text-[#888888] py-4">Verifying reset link…</p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="password" required>New Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="confirm" required>Confirm Password</Label>
        <Input
          id="confirm"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button
        type="submit"
        className="w-full"
        loading={loading}
        loadingText="Updating…"
      >
        Update Password
      </Button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">Reset Password</h1>
      <p className="text-sm text-[#555555] mb-6">Enter your new password below.</p>
      <Suspense fallback={<p className="text-center text-sm text-[#888888]">Loading…</p>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  )
}
