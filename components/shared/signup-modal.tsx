'use client'

import { useState } from 'react'
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
import { UserRole } from '@/types/database'

interface SignUpModalProps {
  open: boolean
  onClose: () => void
}

const roles: { value: UserRole; label: string; description: string }[] = [
  { value: 'shadchan', label: 'Shadchan', description: 'I make shidduchim professionally' },
  { value: 'single', label: 'Single', description: 'I am looking for my bashert' },
  { value: 'parent', label: 'Parent', description: 'I am helping my child find a match' },
  { value: 'advocate', label: 'Advocate', description: 'I advocate for singles in the process' },
]

export function SignUpModal({ open, onClose }: SignUpModalProps) {
  const [step, setStep] = useState<'role' | 'details'>('role')
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function handleNext() {
    if (selectedRole) setStep('details')
  }

  async function handleSubmit() {
    if (!email || !selectedRole) return
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 800))
    setSubmitting(false)
    onClose()
    setStep('role')
    setSelectedRole(null)
    setEmail('')
  }

  function handleClose() {
    onClose()
    setTimeout(() => {
      setStep('role')
      setSelectedRole(null)
      setEmail('')
    }, 300)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 'role' ? 'Join MyMatSH' : 'Create Your Account'}
          </DialogTitle>
          <p className="text-sm text-[#555555] mt-1">
            {step === 'role'
              ? 'Select the role that best describes you.'
              : 'Enter your email to get started.'}
          </p>
        </DialogHeader>

        <div className="px-6 pb-2">
          {step === 'role' ? (
            <div className="space-y-2 mt-2">
              {roles.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setSelectedRole(r.value)}
                  className={`w-full text-start rounded-xl border-2 px-4 py-3 transition-all ${
                    selectedRole === r.value
                      ? 'border-brand-maroon bg-[#F8F0F5]'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <p className="text-sm font-semibold text-[#1A1A1A]">{r.label}</p>
                  <p className="text-xs text-[#888888] mt-0.5">{r.description}</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4 mt-2">
              <div>
                <Label htmlFor="signup-email" required>Email Address</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <p className="text-xs text-[#888888]">
                You will receive a verification link to activate your account.
                Role: <strong className="text-brand-maroon capitalize">{selectedRole}</strong>
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          {step === 'role' ? (
            <>
              <Button variant="secondary" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleNext} disabled={!selectedRole}>
                Continue
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setStep('role')}>Back</Button>
              <Button
                onClick={handleSubmit}
                loading={submitting}
                loadingText="Sending link..."
                disabled={!email}
              >
                Send Verification Link
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
