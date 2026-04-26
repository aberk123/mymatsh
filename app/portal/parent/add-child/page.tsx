'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  UserCircle,
  Heart,
  MessageSquare,
  ChevronLeft,
  Upload,
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { NavItem } from '@/components/ui/sidebar'

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/portal/parent', icon: LayoutDashboard },
  { label: 'My Child', href: '/portal/parent/child', icon: UserCircle },
  { label: 'Suggestions', href: '/portal/parent/matches', icon: Heart },
  { label: 'Messages', href: '/portal/parent/messages', icon: MessageSquare },
]

export default function AddChildPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const photoRef = useRef<HTMLInputElement>(null)
  const resumeRef = useRef<HTMLInputElement>(null)
  const [photoName, setPhotoName] = useState('')
  const [resumeName, setResumeName] = useState('')

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    gender: 'male' as 'male' | 'female',
    dob: '',
    city: '',
    state: '',
    current_yeshiva_seminary: '',
  })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError('First and last name are required.')
      return
    }

    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('first_name', form.first_name.trim())
      fd.append('last_name', form.last_name.trim())
      fd.append('gender', form.gender)
      if (form.dob) fd.append('dob', form.dob)
      if (form.city) fd.append('city', form.city.trim())
      if (form.state) fd.append('state', form.state.trim())
      if (form.current_yeshiva_seminary) fd.append('current_yeshiva_seminary', form.current_yeshiva_seminary.trim())
      const photoFile = photoRef.current?.files?.[0]
      if (photoFile) fd.append('photo', photoFile)
      const resumeFile = resumeRef.current?.files?.[0]
      if (resumeFile) fd.append('resume', resumeFile)

      const res = await fetch('/api/portal/parent/add-child', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Something went wrong. Please try again.')
        return
      }
      router.push('/portal/parent/child')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppLayout navItems={navItems} title="Add Child's Profile" role="parent">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.push('/portal/parent')}
          className="inline-flex items-center gap-1.5 text-sm text-[#555555] hover:text-brand-maroon transition-colors mb-5"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        <div className="mb-6">
          <h1 className="text-xl font-semibold text-[#1A1A1A]">Add Your Child&apos;s Profile</h1>
          <p className="text-sm text-[#555555] mt-1">
            Fill in your child&apos;s information. A shadchan will review the profile and reach out to you.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="card space-y-5">
          {/* Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label required>First Name</Label>
              <Input
                placeholder="e.g. Yosef"
                value={form.first_name}
                onChange={e => set('first_name', e.target.value)}
                required
              />
            </div>
            <div>
              <Label required>Last Name</Label>
              <Input
                placeholder="e.g. Goldstein"
                value={form.last_name}
                onChange={e => set('last_name', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Gender */}
          <div>
            <Label required>Gender</Label>
            <div className="flex gap-6 mt-1">
              {(['male', 'female'] as const).map(g => (
                <label key={g} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value={g}
                    checked={form.gender === g}
                    onChange={() => set('gender', g)}
                    className="accent-brand-maroon"
                  />
                  <span className="text-sm capitalize">{g}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Date of Birth */}
          <div>
            <Label>Date of Birth</Label>
            <Input
              type="date"
              value={form.dob}
              onChange={e => set('dob', e.target.value)}
            />
          </div>

          {/* City / State */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>City</Label>
              <Input
                placeholder="e.g. Brooklyn"
                value={form.city}
                onChange={e => set('city', e.target.value)}
              />
            </div>
            <div>
              <Label>State</Label>
              <Input
                placeholder="e.g. NY"
                value={form.state}
                onChange={e => set('state', e.target.value)}
              />
            </div>
          </div>

          {/* Yeshiva / Seminary */}
          <div>
            <Label>
              {form.gender === 'female' ? 'Seminary' : 'Yeshiva'}
            </Label>
            <Input
              placeholder={form.gender === 'female' ? 'e.g. Bais Yaakov Seminary' : 'e.g. Beis Medrash Govoha'}
              value={form.current_yeshiva_seminary}
              onChange={e => set('current_yeshiva_seminary', e.target.value)}
            />
          </div>

          {/* Photo Upload */}
          <div>
            <Label>Photo (optional)</Label>
            <div className="mt-1">
              <label className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-[#555555] cursor-pointer hover:border-brand-maroon hover:text-brand-maroon transition-colors">
                <Upload className="h-4 w-4" />
                {photoName || 'Choose photo…'}
                <input
                  ref={photoRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => setPhotoName(e.target.files?.[0]?.name ?? '')}
                />
              </label>
              <p className="text-xs text-[#AAAAAA] mt-1">JPG, PNG or WebP</p>
            </div>
          </div>

          {/* Resume Upload */}
          <div>
            <Label>Shidduch Résumé (optional)</Label>
            <div className="mt-1">
              <label className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-[#555555] cursor-pointer hover:border-brand-maroon hover:text-brand-maroon transition-colors">
                <Upload className="h-4 w-4" />
                {resumeName || 'Choose résumé…'}
                <input
                  ref={resumeRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={e => setResumeName(e.target.files?.[0]?.name ?? '')}
                />
              </label>
              <p className="text-xs text-[#AAAAAA] mt-1">PDF or Word document</p>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-gray-100">
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving…' : 'Submit Profile'}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}
