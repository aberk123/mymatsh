'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@/lib/zod-resolver'
import { z } from 'zod'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const passwordSchema = z.object({
  identifier: z.string().min(1, 'Email or phone number is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const otpSchema = z.object({
  phone: z.string().min(10, 'Valid phone number required'),
})

type PasswordFormData = z.infer<typeof passwordSchema>
type OtpFormData = z.infer<typeof otpSchema>

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const useOtp = searchParams.get('type') === 'phone'
  const resetSuccess = searchParams.get('reset') === '1'

  const passwordForm = useForm<PasswordFormData>({ resolver: zodResolver(passwordSchema) })
  const otpForm = useForm<OtpFormData>({ resolver: zodResolver(otpSchema) })

  async function onPasswordSubmit(data: PasswordFormData) {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: data.identifier, password: data.password }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error ?? 'Login failed')
      router.push(result.redirectTo ?? '/dashboard')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Login failed')
    }
  }

  async function onOtpSubmit(data: OtpFormData) {
    try {
      const res = await fetch('/api/auth/otp-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to send OTP')
      router.push(`/verify?phone=${encodeURIComponent(data.phone)}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to send OTP')
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">Welcome Back</h1>
      <p className="text-sm text-[#555555] mb-6">Sign in to your MyMatSH account</p>

      {resetSuccess && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700">
          Password updated successfully — please log in.
        </div>
      )}

      {/* Login type toggle */}
      <div className="flex rounded-lg border border-gray-200 mb-6 overflow-hidden">
        <Link
          href="/login"
          className={`flex-1 py-2 text-center text-sm font-medium transition-colors ${!useOtp ? 'bg-brand-maroon text-white' : 'text-[#555555] hover:bg-gray-50'}`}
        >
          Password Login
        </Link>
        <Link
          href="/login?type=phone"
          className={`flex-1 py-2 text-center text-sm font-medium transition-colors ${useOtp ? 'bg-brand-maroon text-white' : 'text-[#555555] hover:bg-gray-50'}`}
        >
          Phone / OTP
        </Link>
      </div>

      {useOtp ? (
        <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="otp-phone" required>Phone Number</Label>
            <Input
              id="otp-phone"
              type="tel"
              placeholder="+1 (555) 000-0000"
              error={otpForm.formState.errors.phone?.message}
              {...otpForm.register('phone')}
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            loading={otpForm.formState.isSubmitting}
            loadingText="Sending code..."
          >
            Send Verification Code
          </Button>
          <p className="text-xs text-[#888888] text-center">
            For Singles and Parents — we will send a 6-digit code via SMS
          </p>
        </form>
      ) : (
        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="identifier" required>Email or Phone Number</Label>
            <Input
              id="identifier"
              type="text"
              placeholder="you@example.com or +1 (555) 000-0000"
              error={passwordForm.formState.errors.identifier?.message}
              {...passwordForm.register('identifier')}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="password" required>Password</Label>
              <Link href="/forgot-password" className="text-xs text-brand-maroon hover:underline">
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              error={passwordForm.formState.errors.password?.message}
              {...passwordForm.register('password')}
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            loading={passwordForm.formState.isSubmitting}
            loadingText="Signing in..."
          >
            Sign In
          </Button>
        </form>
      )}

      <p className="text-sm text-center text-[#555555] mt-6">
        Don&apos;t have an account?{' '}
        <Link href="/" className="text-brand-maroon font-medium hover:underline">
          Sign Up
        </Link>
      </p>
      <p className="text-sm text-center text-[#555555] mt-2">
        Are you a shadchan?{' '}
        <Link href="/signup/shadchan" className="text-brand-maroon font-medium hover:underline">
          Apply for an account
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="bg-white rounded-2xl shadow-xl p-8 text-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
