'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Heart,
  CalendarCheck,
  MessageSquare,
  UsersRound,
  UserCircle,
  ChevronLeft,
  Zap,
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { NavItem } from '@/components/ui/sidebar'
import { useUnreadMessageCount } from '@/lib/use-unread-messages'

const HEIGHT_OPTIONS = [
  { value: 0, label: '— Select —' },
  ...Array.from({ length: 19 }, (_, i) => {
    const inches = 60 + i
    return { value: inches, label: `${Math.floor(inches / 12)}'${inches % 12}"` }
  }),
]

export default function QuickAddPage() {
  const unreadMsgCount = useUnreadMessageCount()
  const router = useRouter()

  const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'My Singles', href: '/dashboard/singles', icon: Users },
    { label: 'Suggestions', href: '/dashboard/matches', icon: Heart },
    { label: 'Calendar', href: '/dashboard/tasks', icon: CalendarCheck },
    { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare, ...(unreadMsgCount > 0 ? { badge: String(unreadMsgCount) } : {}) },
    { label: 'Groups', href: '/dashboard/groups', icon: UsersRound },
    { label: 'My Profile', href: '/dashboard/profile', icon: UserCircle },
  ]

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState('')
  const [age, setAge] = useState('')
  const [heightInches, setHeightInches] = useState(0)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim()) {
      setError('First and last name are required.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/singles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          gender,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          city: city.trim() || undefined,
          age: age ? parseInt(age, 10) : undefined,
          height_inches: heightInches || undefined,
          about_bio: notes.trim() || undefined,
          status: 'draft',
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Failed to save. Please try again.')
        return
      }
      router.push(`/dashboard/singles/${json.id}`)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppLayout navItems={navItems} title="Quick Add Single" role="shadchan">
      <div className="mb-4">
        <Link href="/dashboard/singles" className="inline-flex items-center gap-1.5 text-sm text-[#555555] hover:text-brand-maroon transition-colors">
          <ChevronLeft className="h-4 w-4" />
          Back to My Singles
        </Link>
      </div>

      <div className="max-w-lg mx-auto">
        <div className="mb-5 flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-brand-maroon/10 flex items-center justify-center flex-shrink-0">
            <Zap className="h-4 w-4 text-brand-maroon" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[#1A1A1A]">Quick Add Single</h1>
            <p className="text-sm text-[#555555] mt-0.5">Capture the basics quickly — fill in the full profile later.</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="card space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label required className="field-label">First Name</Label>
              <Input
                className="input-base mt-1"
                placeholder="Yosef"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label required className="field-label">Last Name</Label>
              <Input
                className="input-base mt-1"
                placeholder="Goldstein"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label className="field-label">Gender</Label>
            <div className="flex gap-4 mt-1.5">
              {(['male', 'female'] as const).map((g) => (
                <label key={g} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value={g}
                    checked={gender === g}
                    onChange={() => setGender(g)}
                    className="accent-brand-maroon"
                  />
                  <span className="text-sm capitalize">{g}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="field-label">Phone</Label>
              <Input
                type="tel"
                className="input-base mt-1"
                placeholder="(718) 555-0100"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <Label className="field-label">Email</Label>
              <Input
                type="email"
                className="input-base mt-1"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="field-label">City</Label>
              <Input
                className="input-base mt-1"
                placeholder="Brooklyn"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <div>
              <Label className="field-label">Age</Label>
              <Input
                type="number"
                className="input-base mt-1"
                placeholder="24"
                min={18}
                max={99}
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
            </div>
            <div>
              <Label className="field-label">Height</Label>
              <select
                className="input-base mt-1 w-full"
                value={heightInches}
                onChange={(e) => setHeightInches(parseInt(e.target.value, 10))}
              >
                {HEIGHT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label className="field-label">Quick Notes</Label>
            <Textarea
              className="input-base mt-1 resize-none"
              rows={3}
              placeholder="Any initial notes about this single…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <p className="text-xs text-[#888888]">Saved as Draft — complete the full profile afterwards.</p>
            <Button type="submit" variant="primary" disabled={saving} className="min-w-[120px]">
              {saving ? 'Saving…' : 'Quick Save'}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}
