'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { OtpInput } from '@/components/ui/otp-input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

function VerifyForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const phone = searchParams.get('phone') ?? ''
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  async function handleVerify() {
    if (otp.length < 6) {
      toast.error('Please enter the 6-digit code')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/otp-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error ?? 'Verification failed')
      toast.success('Verified successfully!')
      router.push(result.redirectTo ?? '/single/dashboard')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setResending(true)
    try {
      const res = await fetch('/api/auth/otp-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      if (!res.ok) throw new Error('Failed to resend')
      setResent(true)
      setOtp('')
      setTimeout(() => setResent(false), 5000)
    } catch {
      toast.error('Failed to resend code')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
      <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">Verify Your Number</h1>
      <p className="text-sm text-[#555555] mb-1">
        We sent a 6-digit code to
      </p>
      <p className="text-sm font-semibold text-brand-maroon mb-8">{phone}</p>

      <OtpInput value={otp} onChange={setOtp} disabled={loading} className="mb-6" />

      {resent && (
        <div className="mb-4 px-4 py-2 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
          One Time Password resent successfully!
        </div>
      )}

      <Button
        className="w-full mb-4"
        onClick={handleVerify}
        loading={loading}
        loadingText="Verifying One Time Password..."
        disabled={otp.length < 6}
      >
        Verify Code
      </Button>

      <button
        onClick={handleResend}
        disabled={resending}
        className="text-sm text-brand-pink hover:underline disabled:opacity-50"
      >
        {resending ? 'Sending...' : 'Resend One Time Password'}
      </button>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="bg-white rounded-2xl shadow-xl p-8 text-center">Loading...</div>}>
      <VerifyForm />
    </Suspense>
  )
}
