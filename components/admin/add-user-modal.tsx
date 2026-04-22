'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@/lib/zod-resolver'
import { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import type { UserRole } from '@/types/database'

const schema = z
  .object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().optional(),
    phone: z.string().optional(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.enum(['shadchan', 'single', 'parent', 'advocate', 'maschil'] as const, {
      error: 'Role is required',
    }),
  })
  .refine(
    (d) => !d.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim()),
    { message: 'Enter a valid email address', path: ['email'] }
  )
  .refine(
    (d) => (d.email && d.email.trim() !== '') || (d.phone && d.phone.trim() !== ''),
    { message: 'Enter email, phone number, or both', path: ['email'] }
  )

type FormData = z.infer<typeof schema>

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'shadchan', label: 'Shadchan' },
  { value: 'single', label: 'Single' },
  { value: 'parent', label: 'Parent' },
  { value: 'advocate', label: 'Advocate' },
  { value: 'maschil', label: 'Maschil' },
]

interface AddUserModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: (user: { id: string; email?: string; phone?: string; role: UserRole }) => void
}

export function AddUserModal({ open, onClose, onSuccess }: AddUserModalProps) {
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error ?? 'Failed to create user')

      const identifier = data.email || data.phone
      toast.success(`Account created for ${identifier}`)
      onSuccess?.(result)
      handleClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create user')
    }
  }

  function handleClose() {
    reset()
    setShowPassword(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add User</DialogTitle>
          <p className="text-sm text-[#555555] mt-1">
            Create a new account. The user can log in immediately.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-6 pb-2 space-y-4">

            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="add-first-name" required>First Name</Label>
                <Input
                  id="add-first-name"
                  type="text"
                  placeholder="Miriam"
                  error={errors.firstName?.message}
                  {...register('firstName')}
                />
              </div>
              <div>
                <Label htmlFor="add-last-name" required>Last Name</Label>
                <Input
                  id="add-last-name"
                  type="text"
                  placeholder="Cohen"
                  error={errors.lastName?.message}
                  {...register('lastName')}
                />
              </div>
            </div>

            {/* Login identifiers */}
            <div className="space-y-1">
              <p className="text-xs text-[#888888]">
                Enter email, phone number, or both — at least one is required for login.
              </p>

              <div>
                <Label htmlFor="add-email">Email Address</Label>
                <Input
                  id="add-email"
                  type="email"
                  placeholder="user@example.com"
                  error={errors.email?.message}
                  {...register('email')}
                />
              </div>

              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-[#888888] font-medium">or</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <div>
                <Label htmlFor="add-phone">Phone Number</Label>
                <Input
                  id="add-phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  error={errors.phone?.message}
                  {...register('phone')}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <Label htmlFor="add-password" required>Password</Label>
              <div className="relative">
                <Input
                  id="add-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  error={errors.password?.message}
                  className="pr-10"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888888] hover:text-[#555555]"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Role */}
            <div>
              <Label htmlFor="add-role" required>Role</Label>
              <select
                id="add-role"
                className={`input-base w-full${errors.role ? ' border-red-400' : ''}`}
                {...register('role')}
              >
                <option value="">Select a role…</option>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              {errors.role && (
                <p className="text-xs text-red-500 mt-1">{errors.role.message}</p>
              )}
            </div>

          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting} loadingText="Creating…">
              Create Account
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
