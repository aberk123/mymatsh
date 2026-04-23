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

type Tab = 'profile' | 'availability' | 'references'

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

      <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-200 p-1 mb-6 w-fit flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
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

            <div className="grid grid-cols-3 gap-3">
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

            <div className="grid grid-cols-3 gap-3">
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

            <div className="grid grid-cols-2 gap-3">
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

            <div className="grid grid-cols-2 gap-3">
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
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <Button onClick={handleSave} className="btn-primary gap-2" disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? 'Saving…' : 'Save Profile'}
          </Button>
        </div>
      </div>
    </AppLayout>
  )
}
