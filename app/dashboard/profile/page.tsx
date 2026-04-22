'use client'

import { useState } from 'react'
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

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'My Singles', href: '/dashboard/singles', icon: Users },
  { label: 'Suggestions', href: '/dashboard/matches', icon: Heart },
  { label: 'Calendar', href: '/dashboard/tasks', icon: CalendarCheck },
  { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare, badge: '3' },
  { label: 'Groups', href: '/dashboard/groups', icon: UsersRound },
  { label: 'My Profile', href: '/dashboard/profile', icon: UserCircle },
]

type Tab = 'profile' | 'availability' | 'references'

const LANGUAGE_OPTIONS = ['English', 'Hebrew', 'Yiddish', 'French', 'Russian', 'Spanish']

const mockOrgs = [
  { id: 'org1', name: 'Lakewood Shadchanim Association' },
  { id: 'org2', name: 'National Council of Shadchanim' },
  { id: 'org3', name: 'Torah Connections Network' },
  { id: 'org4', name: 'Independent (no org)' },
]

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile')

  // Profile tab state
  const [title, setTitle] = useState('Mrs.')
  const [fullName, setFullName] = useState('Sarah Kessler')
  const [city, setCity] = useState('Brooklyn')
  const [state, setState] = useState('NY')
  const [country, setCountry] = useState('USA')
  const [phone, setPhone] = useState('(718) 555-0192')
  const [email, setEmail] = useState('sarah@kesslershidduchim.com')
  const [languages, setLanguages] = useState<string[]>(['English', 'Hebrew'])
  const [yearsExperience, setYearsExperience] = useState('6-10')
  const [shidduchimMade, setShidduchimMade] = useState('11-20')
  const [typeOfService, setTypeOfService] = useState('I specialize in Yeshivish and Modern Orthodox singles ages 20-35.')
  const [about, setAbout] = useState("I have been a shadchan for over 12 years with a deep commitment to each single I represent. I take time to understand each person's values and goals before making any suggestion.")

  // Availability tab state
  const [availability, setAvailability] = useState('Part Time')
  const [bestContactMethod, setBestContactMethod] = useState('Phone')
  const [secondBestContactMethod, setSecondBestContactMethod] = useState('WhatsApp')
  const [bestDay, setBestDay] = useState('Weekdays')
  const [bestTime, setBestTime] = useState('Evening')
  const [availableForAdvocacy, setAvailableForAdvocacy] = useState(true)
  const [ratesForServices, setRatesForServices] = useState('I do not charge for my services. Donations are welcome and appreciated.')

  // References & Settings tab state
  const [reference1, setReference1] = useState('Rabbi Yitzchok Feldman — (718) 555-0143')
  const [reference2, setReference2] = useState('Mrs. Chana Horowitz — (732) 555-0211')
  const [hidePersonalInfo, setHidePersonalInfo] = useState(false)
  const [organizationId, setOrganizationId] = useState('org1')

  function toggleLanguage(lang: string) {
    setLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    )
  }

  function handleSave() {
    // In production, submit to API
    alert('Profile saved!')
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'profile',      label: 'Profile'                   },
    { id: 'availability', label: 'Availability & Contact'    },
    { id: 'references',   label: 'References & Settings'     },
  ]

  return (
    <AppLayout navItems={navItems} title="My Profile" role="shadchan">
      {/* Page header */}
      <div className="flex items-start gap-4 mb-6">
        <Avatar name={fullName} size="lg" />
        <div>
          <h2 className="text-2xl font-bold text-[#1A1A1A]">{fullName}</h2>
          <p className="text-sm text-[#555555] mt-0.5">{city}, {state} · Shadchan</p>
        </div>
      </div>

      {/* Tabs */}
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
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="card space-y-5">
            <h3 className="font-semibold text-[#1A1A1A] flex items-center gap-2">
              <User className="h-4 w-4 text-brand-maroon" />
              Personal Information
            </h3>

            {/* Title + Full Name */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="field-label">Title</Label>
                <select
                  className="input-base mt-1 w-full"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                >
                  <option>Mr.</option>
                  <option>Mrs.</option>
                  <option>Dr.</option>
                  <option>Rabbi</option>
                  <option>Rebbetzin</option>
                </select>
              </div>
              <div className="col-span-2">
                <Label className="field-label">Full Name</Label>
                <Input
                  className="input-base mt-1"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>

            {/* City / State / Country */}
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

            {/* Phone + Email */}
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

            {/* Languages */}
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

            {/* Years Experience + Shidduchim Made */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="field-label">Years Experience</Label>
                <select
                  className="input-base mt-1 w-full"
                  value={yearsExperience}
                  onChange={(e) => setYearsExperience(e.target.value)}
                >
                  <option value="1-2">1–2 years</option>
                  <option value="3-5">3–5 years</option>
                  <option value="6-10">6–10 years</option>
                  <option value="11-20">11–20 years</option>
                  <option value="20+">20+ years</option>
                </select>
              </div>
              <div>
                <Label className="field-label">Shidduchim Made</Label>
                <select
                  className="input-base mt-1 w-full"
                  value={shidduchimMade}
                  onChange={(e) => setShidduchimMade(e.target.value)}
                >
                  <option value="1-5">1–5</option>
                  <option value="6-10">6–10</option>
                  <option value="11-20">11–20</option>
                  <option value="20+">20+</option>
                </select>
              </div>
            </div>

            {/* Type of Service */}
            <div>
              <Label className="field-label">Type of Service</Label>
              <Textarea
                className="input-base mt-1 resize-none min-h-[80px]"
                value={typeOfService}
                onChange={(e) => setTypeOfService(e.target.value)}
                placeholder="Describe the type of service you provide..."
              />
            </div>

            {/* About bio */}
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

        {/* Availability & Contact Tab */}
        {activeTab === 'availability' && (
          <div className="card space-y-5">
            <h3 className="font-semibold text-[#1A1A1A]">Availability & Contact Preferences</h3>

            <div>
              <Label className="field-label">Availability</Label>
              <select
                className="input-base mt-1 w-full"
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
              >
                <option>Full Time</option>
                <option>Part Time</option>
                <option>As Needed</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="field-label">Best Contact Method</Label>
                <select
                  className="input-base mt-1 w-full"
                  value={bestContactMethod}
                  onChange={(e) => setBestContactMethod(e.target.value)}
                >
                  <option>Email</option>
                  <option>Phone</option>
                  <option>WhatsApp</option>
                  <option>Text</option>
                </select>
              </div>
              <div>
                <Label className="field-label">Second Best Contact</Label>
                <select
                  className="input-base mt-1 w-full"
                  value={secondBestContactMethod}
                  onChange={(e) => setSecondBestContactMethod(e.target.value)}
                >
                  <option>Email</option>
                  <option>Phone</option>
                  <option>WhatsApp</option>
                  <option>Text</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="field-label">Best Day</Label>
                <select
                  className="input-base mt-1 w-full"
                  value={bestDay}
                  onChange={(e) => setBestDay(e.target.value)}
                >
                  <option>Monday</option>
                  <option>Tuesday</option>
                  <option>Wednesday</option>
                  <option>Thursday</option>
                  <option>Friday</option>
                  <option>Weekdays</option>
                  <option>Weekends</option>
                  <option>Any</option>
                </select>
              </div>
              <div>
                <Label className="field-label">Best Time</Label>
                <select
                  className="input-base mt-1 w-full"
                  value={bestTime}
                  onChange={(e) => setBestTime(e.target.value)}
                >
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

        {/* References & Settings Tab */}
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
                    {mockOrgs.map((org) => (
                      <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save button (always visible) */}
        <div className="mt-4 flex justify-end">
          <Button onClick={handleSave} className="btn-primary gap-2">
            <Save className="h-4 w-4" />
            Save Profile
          </Button>
        </div>
      </div>
    </AppLayout>
  )
}
