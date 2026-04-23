'use client'

import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  UserCircle,
  Heart,
  MessageSquare,
  Pencil,
  X,
  Check,
  Tag,
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar } from '@/components/ui/avatar'
import { StatusBadge } from '@/components/ui/badge'
import type { NavItem } from '@/components/ui/sidebar'
import { createClient } from '@/lib/supabase/client'

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/portal/single', icon: LayoutDashboard },
  { label: 'My Profile', href: '/portal/single/profile', icon: UserCircle },
  { label: 'Suggestions', href: '/portal/single/matches', icon: Heart },
  { label: 'Messages', href: '/portal/single/messages', icon: MessageSquare, badge: '2' },
]

const SYSTEM_LABEL_GROUPS = [
  {
    category: 'Hashkafa',
    labels: ['Yeshivish', 'Modern Orthodox', 'Chassidish', 'Sephardic', 'Baal Teshuva', 'Open Orthodox'],
  },
  {
    category: 'Learning & Career',
    labels: ['Long-term learner', 'Kollel-oriented', 'Working professional', 'STEM career', 'In chinuch', 'Medical professional'],
  },
  {
    category: 'Background',
    labels: ['American FFB', 'Israeli background', 'Gerim / BT family', 'Sephardic background'],
  },
  {
    category: 'Looking For',
    labels: ['Kollel home', 'Flexible on learning', 'Working professional match', 'Open to any background'],
  },
]

interface Profile {
  first_name: string
  last_name: string
  full_hebrew_name: string
  gender: string
  dob: string
  age: number | null
  height_inches: number | null
  address: string
  city: string
  state: string
  country: string
  phone: string
  email: string
  about_bio: string
  looking_for: string
  plans: string
  family_background: string
  current_education: string
  current_yeshiva_seminary: string
  occupation: string
  hashkafa: string
  eretz_yisroel: string
  high_schools: string
  status: 'available' | 'on_hold' | 'engaged' | 'married' | 'inactive' | 'draft'
}

const blankProfile: Profile = {
  first_name: '', last_name: '', full_hebrew_name: '',
  gender: '', dob: '', age: null, height_inches: null,
  address: '', city: '', state: '', country: '',
  phone: '', email: '',
  about_bio: '', looking_for: '', plans: '',
  family_background: '', current_education: '', current_yeshiva_seminary: '',
  occupation: '', hashkafa: '', eretz_yisroel: '', high_schools: '',
  status: 'available',
}

function heightDisplay(inches: number) {
  const ft = Math.floor(inches / 12)
  const inc = inches % 12
  return `${ft}'${inc}"`
}

function hsToString(val: unknown): string {
  if (!val) return ''
  if (typeof val === 'string') return val
  if (Array.isArray(val)) return val.join(', ')
  return ''
}

interface FieldRowProps {
  label: string
  value: string
  editable?: boolean
  editMode?: boolean
  inputType?: 'input' | 'textarea' | 'date' | 'number'
  fieldKey?: string
  editValues?: Record<string, string>
  onChange?: (key: string, val: string) => void
  hint?: string
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
  hint,
}: FieldRowProps) {
  const isEditing = editable && editMode
  return (
    <div className="flex flex-col gap-1 py-3 border-b border-gray-100 last:border-0">
      <span className="field-label">{label}</span>
      {isEditing ? (
        inputType === 'textarea' ? (
          <Textarea
            value={editValues[fieldKey] ?? value}
            onChange={(e) => onChange?.(fieldKey, e.target.value)}
            rows={3}
            className="input-base text-sm"
          />
        ) : (
          <>
            <Input
              type={inputType === 'date' ? 'date' : inputType === 'number' ? 'number' : 'text'}
              value={editValues[fieldKey] ?? value}
              onChange={(e) => onChange?.(fieldKey, e.target.value)}
              className="input-base"
            />
            {hint && <p className="text-xs text-[#888888] mt-0.5">{hint}</p>}
          </>
        )
      ) : (
        <p className="text-sm text-[#1A1A1A]">{value || '—'}</p>
      )}
    </div>
  )
}

export default function SingleProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [singleId, setSingleId] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile>(blankProfile)
  const [editMode, setEditMode] = useState(false)
  const [editValues, setEditValues] = useState<Record<string, string>>({
    first_name: '', last_name: '', full_hebrew_name: '',
    gender: '', dob: '', age: '', height_inches: '',
    address: '', city: '', state: '', country: '',
    phone: '', email: '',
    about_bio: '', looking_for: '', plans: '',
    family_background: '', current_education: '', current_yeshiva_seminary: '',
    occupation: '', hashkafa: '', eretz_yisroel: '', high_schools: '',
  })

  const [selfLabels, setSelfLabels] = useState<string[]>([])
  const [labelsEditMode, setLabelsEditMode] = useState(false)
  const [labelSearch, setLabelSearch] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: single } = await (supabase.from('singles') as any)
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        if (single) {
          setSingleId(single.id)
          const hs = hsToString(single.high_schools)
          setProfile({
            first_name: single.first_name ?? '',
            last_name: single.last_name ?? '',
            full_hebrew_name: single.full_hebrew_name ?? '',
            gender: single.gender ?? '',
            dob: single.dob ?? '',
            age: single.age ?? null,
            height_inches: single.height_inches ?? null,
            address: single.address ?? '',
            city: single.city ?? '',
            state: single.state ?? '',
            country: single.country ?? '',
            phone: single.phone ?? user.phone ?? '',
            email: single.email ?? user.email ?? '',
            about_bio: single.about_bio ?? '',
            looking_for: single.looking_for ?? '',
            plans: single.plans ?? '',
            family_background: single.family_background ?? '',
            current_education: single.current_education ?? '',
            current_yeshiva_seminary: single.current_yeshiva_seminary ?? '',
            occupation: single.occupation ?? '',
            hashkafa: single.hashkafa ?? '',
            eretz_yisroel: single.eretz_yisroel ?? '',
            high_schools: hs,
            status: single.status ?? 'available',
          })
          setEditValues({
            first_name: single.first_name ?? '',
            last_name: single.last_name ?? '',
            full_hebrew_name: single.full_hebrew_name ?? '',
            gender: single.gender ?? '',
            dob: single.dob ?? '',
            age: single.age != null ? String(single.age) : '',
            height_inches: single.height_inches != null ? String(single.height_inches) : '',
            address: single.address ?? '',
            city: single.city ?? '',
            state: single.state ?? '',
            country: single.country ?? '',
            phone: single.phone ?? user.phone ?? '',
            email: single.email ?? user.email ?? '',
            about_bio: single.about_bio ?? '',
            looking_for: single.looking_for ?? '',
            plans: single.plans ?? '',
            family_background: single.family_background ?? '',
            current_education: single.current_education ?? '',
            current_yeshiva_seminary: single.current_yeshiva_seminary ?? '',
            occupation: single.occupation ?? '',
            hashkafa: single.hashkafa ?? '',
            eretz_yisroel: single.eretz_yisroel ?? '',
            high_schools: hs,
          })
          if (Array.isArray(single.self_labels)) setSelfLabels(single.self_labels)
        } else {
          const meta = user.user_metadata ?? {}
          const email = user.email ?? ''
          const phone = user.phone ?? ''
          const first_name = (meta.first_name as string) ?? ''
          const last_name = (meta.last_name as string) ?? ''
          setProfile(p => ({ ...p, first_name, last_name, email, phone }))
          setEditValues(v => ({ ...v, first_name, last_name, email, phone }))
        }
      }
      setLoading(false)
    })
  }, [])

  function handleChange(key: string, val: string) {
    setEditValues(prev => ({ ...prev, [key]: val }))
  }

  async function handleSave() {
    if (!singleId) {
      setSaveError('Profile record not found. Please contact support.')
      return
    }
    setSaving(true)
    setSaveError('')
    try {
      const payload: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(editValues)) {
        if (k === 'height_inches') {
          payload.height_inches = v !== '' ? (parseInt(v, 10) || null) : null
        } else if (k === 'age') {
          payload.age = v !== '' ? (parseInt(v, 10) || null) : null
        } else if (k === 'high_schools') {
          payload.high_schools = v.trim()
            ? v.split(',').map(s => s.trim()).filter(Boolean)
            : null
        } else {
          payload[k] = v !== '' ? v : null
        }
      }

      const res = await fetch(`/api/singles/${singleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const json = await res.json()
        setSaveError(json.error ?? 'Failed to save. Please try again.')
        return
      }
      setProfile(p => ({
        ...p,
        ...(editValues as unknown as Partial<Profile>),
        height_inches: payload.height_inches as number | null,
        age: payload.age as number | null,
        high_schools: editValues.high_schools,
      }))
      setEditMode(false)
    } catch {
      setSaveError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  function toggleSelfLabel(label: string) {
    setSelfLabels(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    )
  }

  async function handleSaveLabels() {
    if (singleId) {
      await fetch(`/api/singles/${singleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ self_labels: selfLabels }),
      })
    }
    setLabelsEditMode(false)
    setLabelSearch('')
  }

  const displayName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Your Name'
  const displayLocation = [profile.city, profile.state].filter(Boolean).join(', ')

  const filteredLabels = SYSTEM_LABEL_GROUPS.map(group => ({
    ...group,
    labels: group.labels.filter(l =>
      !labelSearch || l.toLowerCase().includes(labelSearch.toLowerCase())
    ),
  })).filter(group => group.labels.length > 0)

  const fieldProps = { editMode, editValues, onChange: handleChange }

  if (loading) {
    return (
      <AppLayout navItems={navItems} title="My Profile" role="single">
        <div className="flex items-center justify-center py-24 text-[#888888] text-sm">Loading…</div>
      </AppLayout>
    )
  }

  return (
    <AppLayout navItems={navItems} title="My Profile" role="single">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Avatar name={displayName} size="lg" />
          <div>
            <h2 className="text-xl font-bold text-[#1A1A1A]">{displayName}</h2>
            {displayLocation && <p className="text-sm text-[#555555]">{displayLocation}</p>}
            <div className="mt-1"><StatusBadge status={profile.status} /></div>
          </div>
        </div>
        <div className="flex gap-2">
          {editMode ? (
            <>
              <Button variant="secondary" size="sm" onClick={() => { setEditMode(false); setSaveError('') }} className="gap-1.5">
                <X className="h-3.5 w-3.5" /> Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
                <Check className="h-3.5 w-3.5" /> {saving ? 'Saving…' : 'Save Changes'}
              </Button>
            </>
          ) : (
            <Button variant="outline-maroon" size="sm" onClick={() => setEditMode(true)} className="gap-1.5">
              <Pencil className="h-3.5 w-3.5" /> Edit My Info
            </Button>
          )}
        </div>
      </div>

      {saveError && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {saveError}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="card">
          <h3 className="font-semibold text-[#1A1A1A] mb-2">Personal Information</h3>
          <FieldRow label="First Name" value={editValues.first_name || profile.first_name} editable fieldKey="first_name" {...fieldProps} />
          <FieldRow label="Last Name" value={editValues.last_name || profile.last_name} editable fieldKey="last_name" {...fieldProps} />
          <FieldRow label="Hebrew Name" value={editValues.full_hebrew_name || profile.full_hebrew_name} editable fieldKey="full_hebrew_name" {...fieldProps} />
          <FieldRow label="Gender" value={editValues.gender || profile.gender} editable fieldKey="gender" {...fieldProps} />
          <FieldRow label="Date of Birth" value={editValues.dob || profile.dob} editable inputType="date" fieldKey="dob" {...fieldProps} />
          <FieldRow label="Age" value={editValues.age || (profile.age != null ? String(profile.age) : '')} editable inputType="number" fieldKey="age" {...fieldProps} />
          <FieldRow
            label="Height"
            value={profile.height_inches ? heightDisplay(profile.height_inches) : ''}
            editable
            inputType="number"
            fieldKey="height_inches"
            hint={`Total inches, e.g. 70 for 5'10"`}
            {...fieldProps}
          />
          <FieldRow label="Phone" value={editValues.phone || profile.phone} editable fieldKey="phone" {...fieldProps} />
          <FieldRow label="Email" value={editValues.email || profile.email} editable fieldKey="email" {...fieldProps} />
          <FieldRow label="Address" value={editValues.address || profile.address} editable fieldKey="address" {...fieldProps} />
          <FieldRow label="City" value={editValues.city || profile.city} editable fieldKey="city" {...fieldProps} />
          <FieldRow label="State" value={editValues.state || profile.state} editable fieldKey="state" {...fieldProps} />
          <FieldRow label="Country" value={editValues.country || profile.country} editable fieldKey="country" {...fieldProps} />
        </div>

        {/* Background & Education */}
        <div className="card">
          <h3 className="font-semibold text-[#1A1A1A] mb-2">Background & Education</h3>
          <FieldRow label="Hashkafa" value={editValues.hashkafa || profile.hashkafa} editable fieldKey="hashkafa" {...fieldProps} />
          <FieldRow label="Family Background" value={editValues.family_background || profile.family_background} editable inputType="textarea" fieldKey="family_background" {...fieldProps} />
          <FieldRow label="High School(s)" value={editValues.high_schools || profile.high_schools} editable fieldKey="high_schools" hint="Comma-separated if multiple" {...fieldProps} />
          <FieldRow label="Eretz Yisroel" value={editValues.eretz_yisroel || profile.eretz_yisroel} editable fieldKey="eretz_yisroel" {...fieldProps} />
          <FieldRow label="Current Yeshiva / Seminary" value={editValues.current_yeshiva_seminary || profile.current_yeshiva_seminary} editable fieldKey="current_yeshiva_seminary" {...fieldProps} />
          <FieldRow label="Current Education / Program" value={editValues.current_education || profile.current_education} editable fieldKey="current_education" {...fieldProps} />
          <FieldRow label="Occupation" value={editValues.occupation || profile.occupation} editable fieldKey="occupation" {...fieldProps} />
        </div>

        {/* About Me */}
        <div className="card">
          <h3 className="font-semibold text-[#1A1A1A] mb-2">About Me</h3>
          <FieldRow label="Bio" value={editValues.about_bio || profile.about_bio} editable inputType="textarea" fieldKey="about_bio" {...fieldProps} />
          <FieldRow label="Plans" value={editValues.plans || profile.plans} editable inputType="textarea" fieldKey="plans" {...fieldProps} />
        </div>

        {/* Looking For */}
        <div className="card">
          <h3 className="font-semibold text-[#1A1A1A] mb-2">What I Am Looking For</h3>
          <FieldRow label="Looking For" value={editValues.looking_for || profile.looking_for} editable inputType="textarea" fieldKey="looking_for" {...fieldProps} />
        </div>

        {/* Labels */}
        <div className="card xl:col-span-2">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h3 className="font-semibold text-[#1A1A1A] flex items-center gap-2">
                <Tag className="h-4 w-4 text-brand-maroon" />
                My Labels
              </h3>
              <p className="text-xs text-[#888888] mt-0.5">
                Labels you select are visible to Shadchanim and help them find you when searching.
              </p>
            </div>
            {labelsEditMode ? (
              <div className="flex gap-2 shrink-0">
                <Button variant="secondary" size="sm" onClick={() => { setLabelsEditMode(false); setLabelSearch('') }} className="gap-1.5">
                  <X className="h-3.5 w-3.5" /> Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handleSaveLabels} className="gap-1.5">
                  <Check className="h-3.5 w-3.5" /> Save Labels
                </Button>
              </div>
            ) : (
              <Button variant="outline-maroon" size="sm" onClick={() => setLabelsEditMode(true)} className="gap-1.5 shrink-0">
                <Pencil className="h-3.5 w-3.5" /> Edit Labels
              </Button>
            )}
          </div>

          {!labelsEditMode && (
            <div className="flex flex-wrap gap-2">
              {selfLabels.length > 0 ? (
                selfLabels.map(label => (
                  <span key={label} className="text-xs bg-[#F8F0F5] text-brand-maroon px-3 py-1 rounded-full font-medium">
                    {label}
                  </span>
                ))
              ) : (
                <p className="text-sm text-[#888888]">No labels selected. Click &quot;Edit Labels&quot; to add some.</p>
              )}
            </div>
          )}

          {labelsEditMode && (
            <div className="space-y-4">
              <Input
                placeholder="Search labels…"
                value={labelSearch}
                onChange={(e) => setLabelSearch(e.target.value)}
                className="input-base max-w-sm"
              />
              {filteredLabels.map(group => (
                <div key={group.category}>
                  <p className="text-xs font-semibold text-[#888888] uppercase tracking-wide mb-2">
                    {group.category}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {group.labels.map(label => {
                      const selected = selfLabels.includes(label)
                      return (
                        <button
                          key={label}
                          onClick={() => toggleSelfLabel(label)}
                          className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-all ${
                            selected
                              ? 'bg-brand-maroon text-white border-brand-maroon'
                              : 'bg-white text-[#555555] border-gray-300 hover:border-brand-maroon hover:text-brand-maroon'
                          }`}
                        >
                          {selected && <Check className="inline h-3 w-3 mr-1" />}
                          {label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
