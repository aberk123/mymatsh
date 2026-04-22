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
import { toast } from 'sonner'

interface AddShadchanModalProps {
  open: boolean
  onClose: () => void
}

const YEAR_OPTIONS = ['1–2 years', '3–5 years', '6–10 years', '11–20 years', '20+ years']

export function AddShadchanModal({ open, onClose }: AddShadchanModalProps) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    yearsExperience: '1–2 years',
    reference: '',
    password: '',
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function set(key: string, val: string) {
    setForm((prev) => ({ ...prev, [key]: val }))
    if (errors[key]) setErrors((prev) => { const e = { ...prev }; delete e[key]; return e })
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.firstName.trim()) e.firstName = 'First name is required'
    if (!form.lastName.trim()) e.lastName = 'Last name is required'
    if (!form.email.trim() && !form.phone.trim()) e.email = 'Email or phone is required'
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Valid email required'
    if (!form.password || form.password.length < 8) e.password = 'Password must be at least 8 characters'
    return e
  }

  async function handleSave() {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }
    setSaving(true)
    // TODO: POST /api/admin/users with role: 'shadchan', status: 'active' (admin-added = auto approved)
    await new Promise((r) => setTimeout(r, 700))
    setSaving(false)
    toast.success(`${form.firstName} ${form.lastName} added as Shadchan`)
    onClose()
    setForm({ firstName: '', lastName: '', email: '', phone: '', city: '', state: '', yearsExperience: '1–2 years', reference: '', password: '' })
    setErrors({})
  }

  function handleClose() {
    onClose()
    setTimeout(() => {
      setForm({ firstName: '', lastName: '', email: '', phone: '', city: '', state: '', yearsExperience: '1–2 years', reference: '', password: '' })
      setErrors({})
    }, 300)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Shadchan</DialogTitle>
          <p className="text-sm text-[#555555] mt-1">
            Manually add a shadchan. They will be active immediately.
          </p>
        </DialogHeader>

        <div className="px-6 pb-2 space-y-4">
          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="field-label" required>First Name</Label>
              <Input
                value={form.firstName}
                onChange={(e) => set('firstName', e.target.value)}
                placeholder="Rivka"
                className={errors.firstName ? 'border-red-400' : ''}
              />
              {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
            </div>
            <div>
              <Label className="field-label" required>Last Name</Label>
              <Input
                value={form.lastName}
                onChange={(e) => set('lastName', e.target.value)}
                placeholder="Klein"
                className={errors.lastName ? 'border-red-400' : ''}
              />
              {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
            </div>
          </div>

          {/* Email */}
          <div>
            <Label className="field-label">Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="shadchan@example.com"
              className={errors.email ? 'border-red-400' : ''}
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          {/* Phone */}
          <div>
            <Label className="field-label">Phone</Label>
            <Input
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="(732) 555-0100"
            />
          </div>

          {/* City / State */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="field-label">City</Label>
              <Input value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Lakewood" />
            </div>
            <div>
              <Label className="field-label">State</Label>
              <Input value={form.state} onChange={(e) => set('state', e.target.value)} placeholder="NJ" />
            </div>
          </div>

          {/* Years Experience */}
          <div>
            <Label className="field-label">Years of Experience</Label>
            <select
              className="input-base mt-1 w-full"
              value={form.yearsExperience}
              onChange={(e) => set('yearsExperience', e.target.value)}
            >
              {YEAR_OPTIONS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>

          {/* Reference */}
          <div>
            <Label className="field-label">Reference</Label>
            <Input
              value={form.reference}
              onChange={(e) => set('reference', e.target.value)}
              placeholder="Name and contact info"
            />
          </div>

          {/* Password */}
          <div>
            <Label className="field-label" required>Temporary Password</Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              placeholder="Min 8 characters"
              className={errors.password ? 'border-red-400' : ''}
            />
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button loading={saving} loadingText="Adding…" onClick={handleSave}>
            Add Shadchan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
