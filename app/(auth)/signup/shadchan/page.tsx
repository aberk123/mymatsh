'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface FormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
  confirmPassword: string
}

export default function ShadchanSignupPage() {
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>()

  const password = watch('password')

  async function onSubmit(data: FormData) {
    setSubmitError('')
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'shadchan',
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          email: data.email.trim(),
          phone: data.phone.trim() || undefined,
          password: data.password,
        }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setSubmitError((json as { error?: string }).error ?? 'Something went wrong. Please try again.')
        return
      }
      setSubmitted(true)
    } catch {
      setSubmitError('Network error. Please try again.')
    }
  }

  if (submitted) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <CheckCircle className="h-14 w-14 text-green-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-[#1A1A1A] mb-2">Application Submitted</h1>
        <p className="text-sm text-[#555555]">
          Your application has been submitted. You will be notified by email once approved.
        </p>
        <Link
          href="/login"
          className="inline-block mt-6 text-sm text-brand-maroon font-medium hover:underline"
        >
          Back to Login
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <h1 className="text-2xl font-bold text-[#1A1A1A] mb-1">Shadchan Application</h1>
      <p className="text-sm text-[#555555] mb-6">
        Your application will be reviewed before your account is activated.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="firstName" required>First Name</Label>
            <Input
              id="firstName"
              placeholder="Rivka"
              error={errors.firstName?.message}
              {...register('firstName', { required: 'Required' })}
            />
          </div>
          <div>
            <Label htmlFor="lastName" required>Last Name</Label>
            <Input
              id="lastName"
              placeholder="Klein"
              error={errors.lastName?.message}
              {...register('lastName', { required: 'Required' })}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="email" required>Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register('email', {
              required: 'Email is required',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Valid email required' },
            })}
          />
        </div>

        <div>
          <Label htmlFor="phone">
            Phone{' '}
            <span className="text-[#888888] font-normal text-xs">(optional)</span>
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="(732) 555-0100"
            {...register('phone')}
          />
        </div>

        <div>
          <Label htmlFor="password" required>Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Min 8 characters"
            error={errors.password?.message}
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 8, message: 'Min 8 characters' },
            })}
          />
        </div>

        <div>
          <Label htmlFor="confirmPassword" required>Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Repeat password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword', {
              required: 'Required',
              validate: (val) => val === password || 'Passwords do not match',
            })}
          />
        </div>

        {submitError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {submitError}
          </p>
        )}

        <Button
          type="submit"
          className="w-full"
          loading={isSubmitting}
          loadingText="Submitting…"
        >
          Submit Application
        </Button>
      </form>

      <p className="text-sm text-center text-[#555555] mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-brand-maroon font-medium hover:underline">
          Sign In
        </Link>
      </p>
    </div>
  )
}
