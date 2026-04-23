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

const YEAR_OPTIONS = ['Less than 1 year', '1–2 years', '3–5 years', '6–10 years', '11–20 years', '20+ years']
const DAY_OPTIONS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Weekdays', 'Weekends', 'Any']
const TIME_OPTIONS = ['Any', 'Morning', 'Afternoon', 'Evening']
const CONTACT_OPTIONS = ['Email', 'Phone', 'WhatsApp', 'Text']
const AGE_OPTIONS = ['18–22', '22–26', '26–30', '30–35', '35+', 'All ages']

interface ShadchanForm {
  firstName: string
  lastName: string
  email: string
  phone: string
  city: string
  state: string
  yearsExperience: string
  expertise: string
  ageBracket: string[]
  contactPref: string[]
  bestDay: string[]
  bestTime: string
  reference: string
  password: string
  confirmPassword: string
}

interface SimpleForm {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
  confirmPassword: string
}

const blankShadchan: ShadchanForm = {
  firstName: '', lastName: '', email: '', phone: '', city: '', state: '',
  yearsExperience: '1–2 years', expertise: '',
  ageBracket: [], contactPref: [], bestDay: [],
  bestTime: 'Any', reference: '', password: '', confirmPassword: '',
}

const blankSimple: SimpleForm = {
  firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '',
}

// Chip selector for multi-select fields
function ChipSelect({
  options, selected, onToggle,
}: { options: string[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-1.5">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onToggle(opt)}
          className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-all ${
            selected.includes(opt)
              ? 'bg-brand-maroon text-white border-brand-maroon'
              : 'bg-white text-[#555555] border-gray-300 hover:border-brand-maroon hover:text-brand-maroon'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

export function SignUpModal({ open, onClose }: SignUpModalProps) {
  const [step, setStep] = useState<'role' | 'details'>('role')
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [shadchanForm, setShadchanForm] = useState<ShadchanForm>(blankShadchan)
  const [simpleForm, setSimpleForm] = useState<SimpleForm>(blankSimple)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function setShadchan(key: keyof ShadchanForm, val: string) {
    setShadchanForm((prev) => ({ ...prev, [key]: val }))
    if (errors[key]) setErrors((prev) => { const e = { ...prev }; delete e[key]; return e })
  }

  function toggleChip(key: 'ageBracket' | 'contactPref' | 'bestDay', value: string) {
    setShadchanForm((prev) => {
      const arr = prev[key]
      return { ...prev, [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value] }
    })
  }

  function setSimple(key: keyof SimpleForm, val: string) {
    setSimpleForm((prev) => ({ ...prev, [key]: val }))
    if (errors[key]) setErrors((prev) => { const e = { ...prev }; delete e[key]; return e })
  }

  function validateShadchan(): Record<string, string> {
    const e: Record<string, string> = {}
    if (!shadchanForm.firstName.trim()) e.firstName = 'Required'
    if (!shadchanForm.lastName.trim()) e.lastName = 'Required'
    if (!shadchanForm.email.trim()) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shadchanForm.email.trim())) e.email = 'Valid email required'
    if (!shadchanForm.phone.trim()) e.phone = 'Phone is required'
    if (!shadchanForm.password || shadchanForm.password.length < 8) e.password = 'Min 8 characters'
    if (shadchanForm.password !== shadchanForm.confirmPassword) e.confirmPassword = 'Passwords do not match'
    return e
  }

  function validateSimple(): Record<string, string> {
    const e: Record<string, string> = {}
    if (!simpleForm.firstName.trim()) e.firstName = 'Required'
    if (!simpleForm.lastName.trim()) e.lastName = 'Required'
    if (!simpleForm.email.trim() && !simpleForm.phone.trim()) e.email = 'Email or phone is required'
    if (simpleForm.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(simpleForm.email.trim())) e.email = 'Valid email required'
    if (!simpleForm.password || simpleForm.password.length < 8) e.password = 'Min 8 characters'
    if (simpleForm.password !== simpleForm.confirmPassword) e.confirmPassword = 'Passwords do not match'
    return e
  }

  async function handleSubmit() {
    const e = selectedRole === 'shadchan' ? validateShadchan() : validateSimple()
    if (Object.keys(e).length > 0) { setErrors(e); return }

    setSubmitting(true)
    try {
      const body = selectedRole === 'shadchan'
        ? { role: 'shadchan', ...shadchanForm }
        : { role: selectedRole, ...simpleForm }

      await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      setSubmitted(true)
    } catch {
      // show generic error
    } finally {
      setSubmitting(false)
    }
  }

  function handleClose() {
    onClose()
    setTimeout(() => {
      setStep('role')
      setSelectedRole(null)
      setShadchanForm(blankShadchan)
      setSimpleForm(blankSimple)
      setErrors({})
      setSubmitted(false)
    }, 300)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {submitted
              ? step === 'role' ? 'Join MyMatSH' : 'Application Submitted'
              : step === 'role' ? 'Join MyMatSH' : 'Create Your Account'}
          </DialogTitle>
          {!submitted && (
            <p className="text-sm text-[#555555] mt-1">
              {step === 'role'
                ? 'Select the role that best describes you.'
                : selectedRole === 'shadchan'
                  ? 'Fill in your details. Your application will be reviewed before activation.'
                  : 'Enter your details to get started.'}
            </p>
          )}
        </DialogHeader>

        <div className="px-6 pb-2">
          {/* Success state */}
          {submitted ? (
            <div className="py-6 text-center space-y-3">
              <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <span className="text-green-600 text-2xl">✓</span>
              </div>
              {selectedRole === 'shadchan' ? (
                <>
                  <p className="font-semibold text-[#1A1A1A]">Application received!</p>
                  <p className="text-sm text-[#555555]">
                    Your shadchan application is under review. You will be notified once it has been approved.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-[#1A1A1A]">Account created!</p>
                  <p className="text-sm text-[#555555]">You can now log in with your credentials.</p>
                </>
              )}
            </div>
          ) : step === 'role' ? (
            /* Step 1: Role selection */
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
          ) : selectedRole === 'shadchan' ? (
            /* Step 2: Shadchan detailed form */
            <div className="space-y-4 mt-2">
              {/* Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="field-label" required>First Name</Label>
                  <Input
                    value={shadchanForm.firstName}
                    onChange={(e) => setShadchan('firstName', e.target.value)}
                    placeholder="Rivka"
                    className={errors.firstName ? 'border-red-400' : ''}
                  />
                  {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <Label className="field-label" required>Last Name</Label>
                  <Input
                    value={shadchanForm.lastName}
                    onChange={(e) => setShadchan('lastName', e.target.value)}
                    placeholder="Klein"
                    className={errors.lastName ? 'border-red-400' : ''}
                  />
                  {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
                </div>
              </div>

              {/* Email */}
              <div>
                <Label className="field-label" required>Email</Label>
                <Input
                  type="email"
                  value={shadchanForm.email}
                  onChange={(e) => setShadchan('email', e.target.value)}
                  placeholder="you@example.com"
                  className={errors.email ? 'border-red-400' : ''}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <Label className="field-label" required>Phone</Label>
                <Input
                  value={shadchanForm.phone}
                  onChange={(e) => setShadchan('phone', e.target.value)}
                  placeholder="(732) 555-0100"
                  className={errors.phone ? 'border-red-400' : ''}
                />
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>

              {/* City / State */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="field-label">City</Label>
                  <Input value={shadchanForm.city} onChange={(e) => setShadchan('city', e.target.value)} placeholder="Lakewood" />
                </div>
                <div>
                  <Label className="field-label">State</Label>
                  <Input value={shadchanForm.state} onChange={(e) => setShadchan('state', e.target.value)} placeholder="NJ" />
                </div>
              </div>

              {/* Years Experience */}
              <div>
                <Label className="field-label">Years of Experience</Label>
                <select
                  className="input-base mt-1 w-full"
                  value={shadchanForm.yearsExperience}
                  onChange={(e) => setShadchan('yearsExperience', e.target.value)}
                >
                  {YEAR_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>

              {/* Expertise */}
              <div>
                <Label className="field-label">Expertise / Hashkafa Specialty</Label>
                <Input
                  value={shadchanForm.expertise}
                  onChange={(e) => setShadchan('expertise', e.target.value)}
                  placeholder="e.g. Yeshivish, Modern Orthodox, Sephardic…"
                />
              </div>

              {/* Age bracket — multi-select chips */}
              <div>
                <Label className="field-label">Age Bracket You Work With</Label>
                <p className="text-xs text-[#888888] mt-0.5">Select all that apply</p>
                <ChipSelect
                  options={AGE_OPTIONS}
                  selected={shadchanForm.ageBracket}
                  onToggle={(v) => toggleChip('ageBracket', v)}
                />
              </div>

              {/* Best Contact Method — multi-select chips */}
              <div>
                <Label className="field-label">Best Contact Method</Label>
                <p className="text-xs text-[#888888] mt-0.5">Select all that apply</p>
                <ChipSelect
                  options={CONTACT_OPTIONS}
                  selected={shadchanForm.contactPref}
                  onToggle={(v) => toggleChip('contactPref', v)}
                />
              </div>

              {/* Best Day — multi-select chips */}
              <div>
                <Label className="field-label">Best Day to Reach</Label>
                <p className="text-xs text-[#888888] mt-0.5">Select all that apply</p>
                <ChipSelect
                  options={DAY_OPTIONS}
                  selected={shadchanForm.bestDay}
                  onToggle={(v) => toggleChip('bestDay', v)}
                />
              </div>

              {/* Best Time */}
              <div>
                <Label className="field-label">Best Time to Reach</Label>
                <select
                  className="input-base mt-1 w-full"
                  value={shadchanForm.bestTime}
                  onChange={(e) => setShadchan('bestTime', e.target.value)}
                >
                  {TIME_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>

              {/* Reference */}
              <div>
                <Label className="field-label">Reference</Label>
                <Input
                  value={shadchanForm.reference}
                  onChange={(e) => setShadchan('reference', e.target.value)}
                  placeholder="Name and contact info"
                />
              </div>

              {/* Password */}
              <div>
                <Label className="field-label" required>Password</Label>
                <Input
                  type="password"
                  value={shadchanForm.password}
                  onChange={(e) => setShadchan('password', e.target.value)}
                  placeholder="Min 8 characters"
                  className={errors.password ? 'border-red-400' : ''}
                />
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
              </div>
              <div>
                <Label className="field-label" required>Confirm Password</Label>
                <Input
                  type="password"
                  value={shadchanForm.confirmPassword}
                  onChange={(e) => setShadchan('confirmPassword', e.target.value)}
                  placeholder="Repeat password"
                  className={errors.confirmPassword ? 'border-red-400' : ''}
                />
                {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
              </div>

              <p className="text-xs text-[#888888] pt-1">
                Shadchan applications are reviewed by our team before activation. You will be contacted once approved.
              </p>
            </div>
          ) : (
            /* Step 2: Simple form for non-shadchan roles */
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="field-label" required>First Name</Label>
                  <Input
                    value={simpleForm.firstName}
                    onChange={(e) => setSimple('firstName', e.target.value)}
                    className={errors.firstName ? 'border-red-400' : ''}
                  />
                  {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <Label className="field-label" required>Last Name</Label>
                  <Input
                    value={simpleForm.lastName}
                    onChange={(e) => setSimple('lastName', e.target.value)}
                    className={errors.lastName ? 'border-red-400' : ''}
                  />
                  {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
                </div>
              </div>

              <div>
                <Label className="field-label">Email</Label>
                <Input
                  type="email"
                  value={simpleForm.email}
                  onChange={(e) => setSimple('email', e.target.value)}
                  placeholder="you@example.com"
                  className={errors.email ? 'border-red-400' : ''}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>

              <div>
                <Label className="field-label" required>Password</Label>
                <Input
                  type="password"
                  value={simpleForm.password}
                  onChange={(e) => setSimple('password', e.target.value)}
                  placeholder="Min 8 characters"
                  className={errors.password ? 'border-red-400' : ''}
                />
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
              </div>
              <div>
                <Label className="field-label" required>Confirm Password</Label>
                <Input
                  type="password"
                  value={simpleForm.confirmPassword}
                  onChange={(e) => setSimple('confirmPassword', e.target.value)}
                  placeholder="Repeat password"
                  className={errors.confirmPassword ? 'border-red-400' : ''}
                />
                {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
              </div>

              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs text-[#888888]">or</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              <div>
                <Label className="field-label">Phone Number</Label>
                <Input
                  value={simpleForm.phone}
                  onChange={(e) => setSimple('phone', e.target.value)}
                  placeholder="(732) 555-0100"
                />
              </div>

              <p className="text-xs text-[#888888]">
                Role: <strong className="text-brand-maroon capitalize">{selectedRole}</strong>
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          {submitted ? (
            <Button onClick={handleClose}>Close</Button>
          ) : step === 'role' ? (
            <>
              <Button variant="secondary" onClick={handleClose}>Cancel</Button>
              <Button onClick={() => selectedRole && setStep('details')} disabled={!selectedRole}>
                Continue
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={() => { setStep('role'); setErrors({}) }}>Back</Button>
              <Button
                onClick={handleSubmit}
                loading={submitting}
                loadingText="Submitting…"
              >
                {selectedRole === 'shadchan' ? 'Submit Application' : 'Create Account'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
