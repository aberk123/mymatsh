'use client'

import { useState } from 'react'
import {
  LayoutDashboard,
  UserCircle,
  Heart,
  MessageSquare,
  Pencil,
  X,
  Check,
  Lock,
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar } from '@/components/ui/avatar'
import { StatusBadge } from '@/components/ui/badge'
import type { NavItem } from '@/components/ui/sidebar'

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/portal/single', icon: LayoutDashboard },
  { label: 'My Profile', href: '/portal/single/profile', icon: UserCircle },
  { label: 'Suggestions', href: '/portal/single/matches', icon: Heart },
  { label: 'Messages', href: '/portal/single/messages', icon: MessageSquare, badge: '2' },
]

const mockProfile = {
  first_name: 'Devorah',
  last_name: 'Levy',
  full_hebrew_name: 'דבורה לוי',
  gender: 'Female',
  dob: '2001-03-14',
  age: 25,
  height_inches: 64,
  city: 'Lakewood',
  state: 'NJ',
  country: 'USA',
  phone: '(732) 555-0192',
  email: 'devorah.levy@email.com',
  about_bio:
    'I am a warm and caring person who loves to learn and grow. I enjoy spending time with family, cooking, and volunteering in my community.',
  looking_for:
    'Someone who is kind, bnei Torah, and has a strong connection to family. I value someone who is growth-oriented and shares my love for a warm Jewish home.',
  photo_url: null,
  family_background: 'Yeshivish/Modern; Father is a Rebbi, Mother is a nurse. Very warm family.',
  current_education: 'Completed seminary in Eretz Yisroel (2022)',
  occupation: 'Kindergarten teacher',
  hashkafa: 'Yeshivish',
  eretz_yisroel: 'Beth Rivkah Seminary, 2021–2022',
  high_schools: 'Bais Yaakov of Lakewood',
  status: 'available',
}

function heightDisplay(inches: number) {
  const ft = Math.floor(inches / 12)
  const inc = inches % 12
  return `${ft}'${inc}"`
}

interface FieldRowProps {
  label: string
  value: string
  editable?: boolean
  editMode?: boolean
  inputType?: 'input' | 'textarea'
  fieldKey?: string
  editValues?: Record<string, string>
  onChange?: (key: string, val: string) => void
}

function FieldRow({
  label,
  value,
  editable = false,
  editMode = false,
  inputType = 'input',
  fieldKey = '',
  editValues = {},
  onChange,
}: FieldRowProps) {
  const isEditing = editable && editMode

  return (
    <div className="flex flex-col gap-1 py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-1.5">
        <span className="field-label">{label}</span>
        {!editable && (
          <Lock className="h-3 w-3 text-gray-400" />
        )}
      </div>
      {isEditing ? (
        inputType === 'textarea' ? (
          <Textarea
            value={editValues[fieldKey] ?? value}
            onChange={(e) => onChange?.(fieldKey, e.target.value)}
            rows={3}
            className="input-base text-sm"
          />
        ) : (
          <Input
            value={editValues[fieldKey] ?? value}
            onChange={(e) => onChange?.(fieldKey, e.target.value)}
            className="input-base"
          />
        )
      ) : (
        <p className="text-sm text-[#1A1A1A]">{value || '—'}</p>
      )}
    </div>
  )
}

export default function SingleProfilePage() {
  const [editMode, setEditMode] = useState(false)
  const [editValues, setEditValues] = useState<Record<string, string>>({
    phone: mockProfile.phone,
    email: mockProfile.email,
    about_bio: mockProfile.about_bio,
    looking_for: mockProfile.looking_for,
  })

  function handleChange(key: string, val: string) {
    setEditValues((prev) => ({ ...prev, [key]: val }))
  }

  function handleSave() {
    setEditMode(false)
    // In production: submit editValues to API
  }

  return (
    <AppLayout navItems={navItems} title="My Profile" role="single">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Avatar name={`${mockProfile.first_name} ${mockProfile.last_name}`} size="lg" />
          <div>
            <h2 className="text-xl font-bold text-[#1A1A1A]">
              {mockProfile.first_name} {mockProfile.last_name}
            </h2>
            <p className="text-sm text-[#555555]">{mockProfile.city}, {mockProfile.state}</p>
            <div className="mt-1">
              <StatusBadge status={mockProfile.status} />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {editMode ? (
            <>
              <Button variant="secondary" size="sm" onClick={() => setEditMode(false)} className="gap-1.5">
                <X className="h-3.5 w-3.5" /> Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSave} className="gap-1.5">
                <Check className="h-3.5 w-3.5" /> Save Changes
              </Button>
            </>
          ) : (
            <Button variant="outline-maroon" size="sm" onClick={() => setEditMode(true)} className="gap-1.5">
              <Pencil className="h-3.5 w-3.5" /> Edit My Info
            </Button>
          )}
        </div>
      </div>

      {editMode && (
        <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-100 text-sm text-blue-700">
          You can edit your contact details and personal descriptions. Other fields are managed by your Shadchan.
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="card">
          <h3 className="font-semibold text-[#1A1A1A] mb-2">Personal Information</h3>
          <FieldRow label="Full Name" value={`${mockProfile.first_name} ${mockProfile.last_name}`} />
          <FieldRow label="Hebrew Name" value={mockProfile.full_hebrew_name} />
          <FieldRow label="Gender" value={mockProfile.gender} />
          <FieldRow label="Date of Birth" value={mockProfile.dob} />
          <FieldRow label="Age" value={String(mockProfile.age)} />
          <FieldRow label="Height" value={heightDisplay(mockProfile.height_inches)} />
          <FieldRow label="City" value={`${mockProfile.city}, ${mockProfile.state}`} />
          <FieldRow
            label="Phone"
            value={mockProfile.phone}
            editable
            editMode={editMode}
            fieldKey="phone"
            editValues={editValues}
            onChange={handleChange}
          />
          <FieldRow
            label="Email"
            value={mockProfile.email}
            editable
            editMode={editMode}
            fieldKey="email"
            editValues={editValues}
            onChange={handleChange}
          />
        </div>

        {/* Background & Education */}
        <div className="card">
          <h3 className="font-semibold text-[#1A1A1A] mb-2">Background & Education</h3>
          <FieldRow label="Hashkafa" value={mockProfile.hashkafa} />
          <FieldRow label="Family Background" value={mockProfile.family_background} />
          <FieldRow label="High School" value={String(mockProfile.high_schools)} />
          <FieldRow label="Eretz Yisroel" value={mockProfile.eretz_yisroel} />
          <FieldRow label="Current Education" value={mockProfile.current_education} />
          <FieldRow label="Occupation" value={mockProfile.occupation} />
        </div>

        {/* About Me */}
        <div className="card">
          <h3 className="font-semibold text-[#1A1A1A] mb-2">About Me</h3>
          <FieldRow
            label="Bio"
            value={mockProfile.about_bio}
            editable
            editMode={editMode}
            inputType="textarea"
            fieldKey="about_bio"
            editValues={editValues}
            onChange={handleChange}
          />
        </div>

        {/* Looking For */}
        <div className="card">
          <h3 className="font-semibold text-[#1A1A1A] mb-2">What I Am Looking For</h3>
          <FieldRow
            label="Looking For"
            value={mockProfile.looking_for}
            editable
            editMode={editMode}
            inputType="textarea"
            fieldKey="looking_for"
            editValues={editValues}
            onChange={handleChange}
          />
        </div>
      </div>
    </AppLayout>
  )
}
