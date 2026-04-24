'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  LayoutDashboard,
  Users,
  Heart,
  CalendarCheck,
  MessageSquare,
  UsersRound,
  UserCircle,
  Save,
  User,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar } from '@/components/ui/avatar'
import type { NavItem } from '@/components/ui/sidebar'
import { createClient } from '@/lib/supabase/client'

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'My Singles', href: '/dashboard/singles', icon: Users },
  { label: 'Suggestions', href: '/dashboard/matches', icon: Heart },
  { label: 'Calendar', href: '/dashboard/tasks', icon: CalendarCheck },
  { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
  { label: 'Groups', href: '/dashboard/groups', icon: UsersRound },
  { label: 'My Profile', href: '/dashboard/profile', icon: UserCircle },
]

type Tab = 'profile' | 'availability' | 'references' | 'labels'

const LANGUAGE_OPTIONS = ['English', 'Hebrew', 'Yiddish', 'French', 'Russian', 'Spanish']
const CONTACT_OPTIONS = ['Email', 'Phone', 'WhatsApp', 'Text']
const DAY_OPTIONS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Weekdays', 'Weekends', 'Any']
const AGE_OPTIONS = ['18–22', '22–26', '26–30', '30–35', '35+', 'All ages']

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

interface OrgOption {
  id: string
  name: string
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [orgs, setOrgs] = useState<OrgOption[]>([])

  // Profile tab state
  const [title, setTitle] = useState('Mr.')
  const [fullName, setFullName] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [country, setCountry] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [languages, setLanguages] = useState<string[]>([])
  const [yearsExperience, setYearsExperience] = useState('1-2')
  const [shidduchimMade, setShidduchimMade] = useState('1-5')
  const [about, setAbout] = useState('')

  // Availability tab state
  const [availability, setAvailability] = useState('Part Time')
  const [bestContactMethod, setBestContactMethod] = useState<string[]>([])
  const [bestDay, setBestDay] = useState<string[]>([])
  const [bestTime, setBestTime] = useState('Any')
  const [ageBracket, setAgeBracket] = useState<string[]>([])
  const [availableForAdvocacy, setAvailableForAdvocacy] = useState(false)
  const [ratesForServices, setRatesForServices] = useState('')

  // References & Settings tab state
  const [reference1, setReference1] = useState('')
  const [reference2, setReference2] = useState('')
  const [hidePersonalInfo, setHidePersonalInfo] = useState(false)
  const [organizationId, setOrganizationId] = useState('')
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smsNotifications, setSmsNotifications] = useState(true)

  // Labels tab state
  interface LabelItem { id: string; name: string; color: string }
  const [labelsList, setLabelsList] = useState<LabelItem[]>([])
  const [labelsLoading, setLabelsLoading] = useState(false)
  const [newLabelName, setNewLabelName] = useState('')
  const [newLabelColor, setNewLabelColor] = useState('#7C3D52')
  const [addingLabel, setAddingLabel] = useState(false)
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null)
  const [editLabelName, setEditLabelName] = useState('')
  const [editLabelColor, setEditLabelColor] = useState('')
  const [savingLabelId, setSavingLabelId] = useState<string | null>(null)
  const [deletingLabelId, setDeletingLabelId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      // Load organizations
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: orgRows } = await (supabase.from('organizations') as any)
        .select('id, name')
        .eq('is_approved', true)
        .order('name', { ascending: true }) as { data: OrgOption[] | null }
      setOrgs(orgRows ?? [])

      // Load shadchan profile via API
      const res = await fetch('/api/shadchan/profile')
      if (res.ok) {
        const { profile } = await res.json() as { profile: Record<string, unknown> | null }
        if (profile) {
          setTitle((profile.title as string) ?? 'Mr.')
          setFullName((profile.full_name as string) ?? '')
          setCity((profile.city as string) ?? '')
          setState((profile.state as string) ?? '')
          setCountry((profile.country as string) ?? '')
          setPhone((profile.phone as string) ?? '')
          setEmail((profile.email as string) ?? '')
          setLanguages((profile.languages as string[]) ?? [])
          setYearsExperience((profile.years_experience as string) ?? '1-2')
          setShidduchimMade((profile.shidduchim_made as string) ?? '1-5')
          setAbout((profile.type_of_service as string) ?? '')
          setAvailability((profile.availability as string) ?? 'Part Time')
          // These are now text[] in the DB — guard against legacy string values
          const bcm = profile.best_contact_method
          setBestContactMethod(Array.isArray(bcm) ? bcm : bcm ? [bcm as string] : [])
          const bd = profile.best_day
          setBestDay(Array.isArray(bd) ? bd : bd ? [bd as string] : [])
          setBestTime((profile.best_time as string) ?? 'Any')
          const ab = profile.age_bracket
          setAgeBracket(Array.isArray(ab) ? ab : ab ? [ab as string] : [])
          setAvailableForAdvocacy((profile.available_for_advocacy as boolean) ?? false)
          setRatesForServices((profile.rates_for_services as string) ?? '')
          setReference1((profile.reference_1 as string) ?? '')
          setReference2((profile.reference_2 as string) ?? '')
          setHidePersonalInfo((profile.hide_personal_info_from_profile as boolean) ?? false)
          setOrganizationId((profile.organization_id as string) ?? '')
          setEmailNotifications((profile.email_notifications as boolean) ?? true)
          setSmsNotifications((profile.sms_notifications as boolean) ?? true)
        } else {
          // Fall back to auth metadata for email
          const { data: { user } } = await supabase.auth.getUser()
          if (user?.email) setEmail(user.email)
        }
      }

      setLoading(false)
    }
    load()
  }, [])

  async function loadLabels() {
    setLabelsLoading(true)
    const res = await fetch('/api/shadchan/labels')
    if (res.ok) {
      const { labels } = await res.json() as { labels: LabelItem[] }
      setLabelsList(labels)
    }
    setLabelsLoading(false)
  }

  async function handleAddLabel() {
    if (!newLabelName.trim()) return
    setAddingLabel(true)
    const res = await fetch('/api/shadchan/labels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newLabelName.trim(), color: newLabelColor }),
    })
    if (res.ok) {
      const { label } = await res.json() as { label: LabelItem }
      setLabelsList(prev => [...prev, label].sort((a, b) => a.name.localeCompare(b.name)))
      setNewLabelName('')
    } else {
      const { error } = await res.json()
      toast.error(error ?? 'Failed to add label.')
    }
    setAddingLabel(false)
  }

  async function handleSaveLabel(id: string) {
    setSavingLabelId(id)
    const res = await fetch(`/api/shadchan/labels/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editLabelName.trim(), color: editLabelColor }),
    })
    if (res.ok) {
      const { label } = await res.json() as { label: LabelItem }
      setLabelsList(prev => prev.map(l => l.id === id ? label : l).sort((a, b) => a.name.localeCompare(b.name)))
      setEditingLabelId(null)
    } else {
      const { error } = await res.json()
      toast.error(error ?? 'Failed to save label.')
    }
    setSavingLabelId(null)
  }

  async function handleDeleteLabel(id: string) {
    setDeletingLabelId(id)
    const res = await fetch(`/api/shadchan/labels/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setLabelsList(prev => prev.filter(l => l.id !== id))
    } else {
      toast.error('Failed to delete label.')
    }
    setDeletingLabelId(null)
  }

  function toggleLanguage(lang: string) {
    setLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    )
  }

  async function handleSave() {
    setSaving(true)
    setSaveError('')
    try {
      const res = await fetch('/api/shadchan/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          full_name: fullName,
          city,
          state,
          country,
          phone,
          email,
          languages,
          years_experience: yearsExperience,
          shidduchim_made: shidduchimMade,
          type_of_service: about,
          availability,
          best_contact_method: bestContactMethod,
          best_day: bestDay,
          best_time: bestTime,
          age_bracket: ageBracket,
          available_for_advocacy: availableForAdvocacy,
          rates_for_services: ratesForServices,
          reference_1: reference1,
          reference_2: reference2,
          hide_personal_info_from_profile: hidePersonalInfo,
          organization_id: organizationId || null,
          email_notifications: emailNotifications,
          sms_notifications: smsNotifications,
        }),
      })
      if (!res.ok) {
        const json = await res.json()
        setSaveError(json.error ?? 'Failed to save. Please try again.')
        return
      }
      toast.success('Profile saved successfully.')
    } catch {
      setSaveError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'profile',      label: 'Profile'                },
    { id: 'availability', label: 'Availability & Contact' },
    { id: 'references',   label: 'References & Settings'  },
    { id: 'labels',       label: 'My Labels'              },
  ]

  if (loading) {
    return (
      <AppLayout navItems={navItems} title="My Profile" role="shadchan">
        <div className="flex items-center justify-center py-24 text-[#888888] text-sm">Loading…</div>
      </AppLayout>
    )
  }

  return (
    <AppLayout navItems={navItems} title="My Profile" role="shadchan">
      <div className="flex items-start gap-4 mb-6">
        <Avatar name={fullName || 'S'} size="lg" />
        <div>
          <h2 className="text-2xl font-bold text-[#1A1A1A]">{fullName || 'Your Name'}</h2>
          <p className="text-sm text-[#555555] mt-0.5">
            {[city, state].filter(Boolean).join(', ') || 'Location not set'} · Shadchan
          </p>
        </div>
      </div>

      {saveError && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {saveError}
        </div>
      )}

      <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-200 p-1 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id)
              if (tab.id === 'labels' && labelsList.length === 0 && !labelsLoading) loadLabels()
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-brand-maroon text-white'
                : 'text-[#555555] hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="max-w-2xl">
        {activeTab === 'profile' && (
          <div className="card space-y-5">
            <h3 className="font-semibold text-[#1A1A1A] flex items-center gap-2">
              <User className="h-4 w-4 text-brand-maroon" />
              Personal Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="field-label">Title</Label>
                <select className="input-base mt-1 w-full" value={title} onChange={(e) => setTitle(e.target.value)}>
                  <option>Mr.</option>
                  <option>Mrs.</option>
                  <option>Dr.</option>
                  <option>Rabbi</option>
                  <option>Rebbetzin</option>
                </select>
              </div>
              <div className="col-span-2">
                <Label className="field-label">Full Name</Label>
                <Input className="input-base mt-1" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="field-label">City</Label>
                <Input className="input-base mt-1" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div>
                <Label className="field-label">State</Label>
                <Input className="input-base mt-1" value={state} onChange={(e) => setState(e.target.value)} />
              </div>
              <div>
                <Label className="field-label">Country</Label>
                <Input className="input-base mt-1" value={country} onChange={(e) => setCountry(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="field-label">Phone</Label>
                <Input className="input-base mt-1" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div>
                <Label className="field-label">Email</Label>
                <Input type="email" className="input-base mt-1" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>

            <div>
              <Label className="field-label mb-2 block">Languages</Label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGE_OPTIONS.map((lang) => (
                  <label key={lang} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={languages.includes(lang)}
                      onChange={() => toggleLanguage(lang)}
                      className="w-4 h-4 rounded border-gray-300 text-brand-maroon focus:ring-brand-maroon"
                    />
                    <span className="text-sm text-[#1A1A1A]">{lang}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="field-label">Years Experience</Label>
                <select className="input-base mt-1 w-full" value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value)}>
                  <option value="1-2">1–2 years</option>
                  <option value="3-5">3–5 years</option>
                  <option value="6-10">6–10 years</option>
                  <option value="11-20">11–20 years</option>
                  <option value="20+">20+ years</option>
                </select>
              </div>
              <div>
                <Label className="field-label">Shidduchim Made</Label>
                <select className="input-base mt-1 w-full" value={shidduchimMade} onChange={(e) => setShidduchimMade(e.target.value)}>
                  <option value="1-5">1–5</option>
                  <option value="6-10">6–10</option>
                  <option value="11-20">11–20</option>
                  <option value="20+">20+</option>
                </select>
              </div>
            </div>

            <div>
              <Label className="field-label">About / Bio</Label>
              <Textarea
                className="input-base mt-1 resize-none min-h-[120px]"
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                placeholder="Tell singles and families about yourself..."
              />
            </div>
          </div>
        )}

        {activeTab === 'availability' && (
          <div className="card space-y-5">
            <h3 className="font-semibold text-[#1A1A1A]">Availability & Contact Preferences</h3>

            <div>
              <Label className="field-label">Availability</Label>
              <select className="input-base mt-1 w-full" value={availability} onChange={(e) => setAvailability(e.target.value)}>
                <option>Full Time</option>
                <option>Part Time</option>
                <option>As Needed</option>
              </select>
            </div>

            <div>
              <Label className="field-label">Age Bracket You Work With</Label>
              <p className="text-xs text-[#888888] mt-0.5">Select all that apply</p>
              <ChipSelect
                options={AGE_OPTIONS}
                selected={ageBracket}
                onToggle={(v) => setAgeBracket((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v])}
              />
            </div>

            <div>
              <Label className="field-label">Best Contact Method</Label>
              <p className="text-xs text-[#888888] mt-0.5">Select all that apply</p>
              <ChipSelect
                options={CONTACT_OPTIONS}
                selected={bestContactMethod}
                onToggle={(v) => setBestContactMethod((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v])}
              />
            </div>

            <div>
              <Label className="field-label">Best Day to Reach</Label>
              <p className="text-xs text-[#888888] mt-0.5">Select all that apply</p>
              <ChipSelect
                options={DAY_OPTIONS}
                selected={bestDay}
                onToggle={(v) => setBestDay((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v])}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="field-label">Best Time</Label>
                <select className="input-base mt-1 w-full" value={bestTime} onChange={(e) => setBestTime(e.target.value)}>
                  <option>Morning</option>
                  <option>Afternoon</option>
                  <option>Evening</option>
                  <option>Any</option>
                </select>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={availableForAdvocacy}
                  onChange={(e) => setAvailableForAdvocacy(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-brand-maroon focus:ring-brand-maroon"
                />
                <div>
                  <span className="text-sm font-medium text-[#1A1A1A]">Available for Advocacy</span>
                  <p className="text-xs text-[#888888]">Allow singles to request you as their advocate</p>
                </div>
              </label>
            </div>

            <div>
              <Label className="field-label">Rates for Services</Label>
              <Textarea
                className="input-base mt-1 resize-none min-h-[80px]"
                value={ratesForServices}
                onChange={(e) => setRatesForServices(e.target.value)}
                placeholder="Describe your rates or fee structure..."
              />
            </div>
          </div>
        )}

        {activeTab === 'references' && (
          <div className="card space-y-5">
            <h3 className="font-semibold text-[#1A1A1A]">References</h3>

            <div>
              <Label className="field-label">Reference 1</Label>
              <Input
                className="input-base mt-1"
                placeholder="Name and contact info..."
                value={reference1}
                onChange={(e) => setReference1(e.target.value)}
              />
            </div>

            <div>
              <Label className="field-label">Reference 2</Label>
              <Input
                className="input-base mt-1"
                placeholder="Name and contact info..."
                value={reference2}
                onChange={(e) => setReference2(e.target.value)}
              />
            </div>

            <div className="border-t border-gray-100 pt-5">
              <h3 className="font-semibold text-[#1A1A1A] mb-4">Settings</h3>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hidePersonalInfo}
                    onChange={(e) => setHidePersonalInfo(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-brand-maroon focus:ring-brand-maroon"
                  />
                  <div>
                    <span className="text-sm font-medium text-[#1A1A1A]">Hide Personal Info from Profile</span>
                    <p className="text-xs text-[#888888]">Your phone and address will not be visible on your public profile</p>
                  </div>
                </label>

                <div>
                  <Label className="field-label">Organization</Label>
                  <select
                    className="input-base mt-1 w-full"
                    value={organizationId}
                    onChange={(e) => setOrganizationId(e.target.value)}
                  >
                    <option value="">Select an organization…</option>
                    {orgs.map((org) => (
                      <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-5">
              <h3 className="font-semibold text-[#1A1A1A] mb-4">Notification Preferences</h3>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-brand-maroon focus:ring-brand-maroon"
                  />
                  <div>
                    <span className="text-sm font-medium text-[#1A1A1A]">Email Notifications</span>
                    <p className="text-xs text-[#888888]">Receive email alerts for approvals, matches, and status changes</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={smsNotifications}
                    onChange={(e) => setSmsNotifications(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-brand-maroon focus:ring-brand-maroon"
                  />
                  <div>
                    <span className="text-sm font-medium text-[#1A1A1A]">SMS Notifications</span>
                    <p className="text-xs text-[#888888]">Receive text message alerts for important updates (requires phone number on profile)</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'labels' && (
          <div className="card space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[#1A1A1A]">My Labels</h3>
              <p className="text-xs text-[#888888]">Use labels to organize and categorize your singles.</p>
            </div>

            {/* Add new label */}
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={newLabelColor}
                onChange={(e) => setNewLabelColor(e.target.value)}
                className="h-9 w-9 rounded cursor-pointer border border-gray-300 p-0.5"
                title="Pick label color"
              />
              <Input
                className="input-base flex-1"
                placeholder="New label name…"
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddLabel() } }}
              />
              <Button
                variant="primary"
                size="sm"
                className="gap-1 whitespace-nowrap"
                disabled={addingLabel || !newLabelName.trim()}
                onClick={handleAddLabel}
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </Button>
            </div>

            {/* Labels list */}
            {labelsLoading ? (
              <p className="text-sm text-[#888888] text-center py-6">Loading…</p>
            ) : labelsList.length === 0 ? (
              <p className="text-sm text-[#888888] text-center py-6">No labels yet. Add your first label above.</p>
            ) : (
              <div className="space-y-2">
                {labelsList.map((lbl) => (
                  <div key={lbl.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50">
                    {editingLabelId === lbl.id ? (
                      <>
                        <input
                          type="color"
                          value={editLabelColor}
                          onChange={(e) => setEditLabelColor(e.target.value)}
                          className="h-8 w-8 rounded cursor-pointer border border-gray-300 p-0.5 flex-shrink-0"
                        />
                        <Input
                          className="input-base flex-1 text-sm"
                          value={editLabelName}
                          onChange={(e) => setEditLabelName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleSaveLabel(lbl.id) }}
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveLabel(lbl.id)}
                          disabled={savingLabelId === lbl.id}
                          className="p-1.5 rounded hover:bg-green-100 text-green-600"
                          title="Save"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingLabelId(null)}
                          className="p-1.5 rounded hover:bg-gray-200 text-[#888888]"
                          title="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <span
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: lbl.color }}
                        />
                        <span className="flex-1 text-sm font-medium text-[#1A1A1A]">{lbl.name}</span>
                        <button
                          onClick={() => { setEditingLabelId(lbl.id); setEditLabelName(lbl.name); setEditLabelColor(lbl.color) }}
                          className="p-1.5 rounded hover:bg-gray-200 text-[#555555]"
                          title="Rename"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteLabel(lbl.id)}
                          disabled={deletingLabelId === lbl.id}
                          className="p-1.5 rounded hover:bg-red-100 text-red-500"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Desktop save button (not shown on labels tab) */}
        {activeTab !== 'labels' && (
          <div className="mt-4 hidden sm:flex justify-end">
            <Button onClick={handleSave} className="btn-primary gap-2" disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? 'Saving…' : 'Save Profile'}
            </Button>
          </div>
        )}

        {/* Mobile sticky save bar (not shown on labels tab) */}
        {activeTab !== 'labels' && (
          <div className="sm:hidden fixed bottom-16 inset-x-0 z-10 bg-white border-t border-gray-100 px-4 py-3">
            <Button onClick={handleSave} className="btn-primary gap-2 w-full" disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? 'Saving…' : 'Save Profile'}
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
