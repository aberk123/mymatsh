'use client'

import { useState } from 'react'
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

const emailSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const phoneSchema = z.object({
  phone: z.string().min(10, 'Valid phone number required'),
})

type EmailFormData = z.infer<typeof emailSchema>
type PhoneFormData = z.infer<typeof phoneSchema>

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const loginType = searchParams.get('type') // 'phone' for singles/parents
  const [usePhone] = useState(loginType === 'phone')

  const emailForm = useForm<EmailFormData>({ resolver: zodResolver(emailSchema) })
  const phoneForm = useForm<PhoneFormData>({ resolver: zodResolver(phoneSchema) })

  async function onEmailSubmit(data: EmailFormData) {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, method: 'email' }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error ?? 'Login failed')
      router.push(result.redirectTo ?? '/dashboard')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Login failed')
    }
  }

  async function onPhoneSubmit(data: PhoneFormData) {
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

      {/* Login type toggle */}
      <div className="flex rounded-lg border border-gray-200 mb-6 overflow-hidden">
        <Link
          href="/login"
          className={`flex-1 py-2 text-center text-sm font-medium transition-colors ${!usePhone ? 'bg-brand-maroon text-white' : 'text-[#555555] hover:bg-gray-50'}`}
        >
          Email Login
        </Link>
        <Link
          href="/login?type=phone"
          className={`flex-1 py-2 text-center text-sm font-medium transition-colors ${usePhone ? 'bg-brand-maroon text-white' : 'text-[#555555] hover:bg-gray-50'}`}
        >
          Phone / OTP
        </Link>
      </div>

      {usePhone ? (
        <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="phone" required>Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 000-0000"
              error={phoneForm.formState.errors.phone?.message}
              {...phoneForm.register('phone')}
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            loading={phoneForm.formState.isSubmitting}
            loadingText="Sending code..."
          >
            Send Verification Code
          </Button>
          <p className="text-xs text-[#888888] text-center">
            For Singles and Parents — we will send a 6-digit code via SMS
          </p>
        </form>
      ) : (
        <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="email" required>Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              error={emailForm.formState.errors.email?.message}
              {...emailForm.register('email')}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="password" required>Password</Label>
              <Link href="/verify" className="text-xs text-brand-maroon hover:underline">
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              error={emailForm.formState.errors.password?.message}
              {...emailForm.register('password')}
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            loading={emailForm.formState.isSubmitting}
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
