'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import {
  LayoutDashboard,
  Users,
  Heart,
  CalendarCheck,
  MessageSquare,
  UsersRound,
  UserCircle,
  ChevronLeft,
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { WizardProgress } from '@/components/ui/dialog'
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

const wizardSteps = [
  { index: 0, label: 'Basic Info' },
  { index: 1, label: 'Contact' },
  { index: 2, label: 'Physical' },
  { index: 3, label: 'Education' },
  { index: 4, label: 'Background' },
  { index: 5, label: 'Profile' },
  { index: 6, label: 'Review' },
]

type FormValues = {
  first_name: string
  last_name: string
  full_hebrew_name: string
  gender: 'male' | 'female'
  dob: string
  age: number
  phone: string
  email: string
  address: string
  city: string
  state: string
  country: string
  postal_code: string
  height_feet: number
  height_inches_rem: number
  current_education: string
  occupation: string
  high_schools: string
  eretz_yisroel: string
  current_yeshiva_seminary: string
  family_background: string
  siblings: string
  hashkafa: string
  about_bio: string
  looking_for: string
  plans: string
  photo_url: string
  resume_url: string
  status: 'draft' | 'available'
  pledge_amount: number
  privacy_show_photo: boolean
  privacy_show_contact: boolean
}

export default function NewSinglePage() {
  const [currentStep, setCurrentStep] = useState(0)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      gender: 'male',
      country: 'USA',
      status: 'draft',
      height_feet: 5,
      height_inches_rem: 8,
      privacy_show_photo: true,
      privacy_show_contact: false,
    },
  })

  const onSubmit = (data: FormValues) => {
    const heightInches = data.height_feet * 12 + data.height_inches_rem
    console.log('New single submitted:', { ...data, height_inches: heightInches })
  }

  const next = () => setCurrentStep((s) => Math.min(s + 1, wizardSteps.length - 1))
  const back = () => setCurrentStep((s) => Math.max(s - 1, 0))

  const watchedGender = watch('gender')

  return (
    <AppLayout navItems={navItems} title="Add New Single" role="shadchan">
      {/* Back link */}
      <div className="mb-4">
        <Link href="/dashboard/singles" className="inline-flex items-center gap-1.5 text-sm text-[#555555] hover:text-brand-maroon transition-colors">
          <ChevronLeft className="h-4 w-4" />
          Back to My Singles
        </Link>
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-[#1A1A1A]">Add New Single</h1>
          <p className="text-sm text-[#555555] mt-1">Complete all steps to create a full profile.</p>
        </div>

        {/* Wizard Progress */}
        <div className="card p-0 overflow-hidden">
          <WizardProgress steps={wizardSteps} currentStep={currentStep} />

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="p-6 space-y-5">

              {/* Step 0: Basic Info */}
              {currentStep === 0 && (
                <>
                  <h2 className="text-base font-semibold text-[#1A1A1A]">Basic Information</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label required>First Name</Label>
                      <Input
                        {...register('first_name', { required: 'First name is required' })}
                        placeholder="e.g. Yosef"
                        error={errors.first_name?.message}
                      />
                    </div>
                    <div>
                      <Label required>Last Name</Label>
                      <Input
                        {...register('last_name', { required: 'Last name is required' })}
                        placeholder="e.g. Goldstein"
                        error={errors.last_name?.message}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Full Hebrew Name</Label>
                      <Input
                        {...register('full_hebrew_name')}
                        placeholder="e.g. יוסף בן אברהם"
                        dir="auto"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label required>Gender</Label>
                      <div className="flex gap-4 mt-1">
                        {(['male', 'female'] as const).map((g) => (
                          <label key={g} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              value={g}
                              {...register('gender', { required: true })}
                              className="accent-brand-maroon"
                            />
                            <span className="text-sm capitalize">{g}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>Date of Birth</Label>
                      <Input type="date" {...register('dob')} />
                    </div>
                    <div>
                      <Label>Age</Label>
                      <Input
                        type="number"
                        {...register('age', { min: 18, max: 99 })}
                        placeholder="e.g. 24"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Step 1: Contact */}
              {currentStep === 1 && (
                <>
                  <h2 className="text-base font-semibold text-[#1A1A1A]">Contact Information</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Phone</Label>
                      <Input {...register('phone')} type="tel" placeholder="(718) 555-0100" />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input {...register('email')} type="email" placeholder="name@example.com" />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Street Address</Label>
                      <Input {...register('address')} placeholder="123 Main St, Apt 4B" />
                    </div>
                    <div>
                      <Label>City</Label>
                      <Input {...register('city')} placeholder="Brooklyn" />
                    </div>
                    <div>
                      <Label>State</Label>
                      <Input {...register('state')} placeholder="NY" />
                    </div>
                    <div>
                      <Label>Country</Label>
                      <Input {...register('country')} placeholder="USA" />
                    </div>
                    <div>
                      <Label>Postal Code</Label>
                      <Input {...register('postal_code')} placeholder="11219" />
                    </div>
                  </div>
                </>
              )}

              {/* Step 2: Physical */}
              {currentStep === 2 && (
                <>
                  <h2 className="text-base font-semibold text-[#1A1A1A]">Physical Information</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <Label>Height</Label>
                      <div className="flex gap-3 mt-1">
                        <div className="flex items-center gap-2 flex-1">
                          <select
                            {...register('height_feet', { valueAsNumber: true })}
                            className="input-base flex-1"
                          >
                            {[4, 5, 6, 7].map((f) => (
                              <option key={f} value={f}>{f} ft</option>
                            ))}
                          </select>
                          <select
                            {...register('height_inches_rem', { valueAsNumber: true })}
                            className="input-base flex-1"
                          >
                            {Array.from({ length: 12 }, (_, i) => (
                              <option key={i} value={i}>{i} in</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Step 3: Education */}
              {currentStep === 3 && (
                <>
                  <h2 className="text-base font-semibold text-[#1A1A1A]">Education & Occupation</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Current Education</Label>
                      <Input
                        {...register('current_education')}
                        placeholder="e.g. Kollel, Graduate School"
                      />
                    </div>
                    <div>
                      <Label>Occupation</Label>
                      <Input
                        {...register('occupation')}
                        placeholder="e.g. Software Engineer"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>High Schools Attended</Label>
                      <Textarea
                        {...register('high_schools')}
                        rows={2}
                        placeholder="List high schools attended, one per line"
                      />
                    </div>
                    <div>
                      <Label>Time in Eretz Yisroel</Label>
                      <Input
                        {...register('eretz_yisroel')}
                        placeholder="e.g. 2 years – Mir Yerushalayim"
                      />
                    </div>
                    <div>
                      <Label>
                        {watchedGender === 'female' ? 'Current Seminary' : 'Current Yeshiva'}
                      </Label>
                      <Input
                        {...register('current_yeshiva_seminary')}
                        placeholder={watchedGender === 'female' ? 'e.g. Bais Yaakov Seminary' : 'e.g. Beis Medrash Govoha'}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Step 4: Background */}
              {currentStep === 4 && (
                <>
                  <h2 className="text-base font-semibold text-[#1A1A1A]">Background</h2>
                  <div className="space-y-4">
                    <div>
                      <Label>Hashkafa</Label>
                      <select {...register('hashkafa')} className="input-base w-full">
                        <option value="">Select…</option>
                        <option value="yeshivish">Yeshivish</option>
                        <option value="modern_orthodox">Modern Orthodox</option>
                        <option value="chassidish">Chassidish</option>
                        <option value="sephardic">Sephardic</option>
                        <option value="baal_teshuva">Baal Teshuva</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <Label>Family Background</Label>
                      <Textarea
                        {...register('family_background')}
                        rows={4}
                        placeholder="Describe family background, upbringing, community…"
                      />
                    </div>
                    <div>
                      <Label>Siblings</Label>
                      <Textarea
                        {...register('siblings')}
                        rows={3}
                        placeholder="e.g. 3 brothers, 2 sisters (oldest married, youngest in yeshiva)"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Step 5: Profile */}
              {currentStep === 5 && (
                <>
                  <h2 className="text-base font-semibold text-[#1A1A1A]">Profile Details</h2>
                  <div className="space-y-4">
                    <div>
                      <Label>About / Bio</Label>
                      <Textarea
                        {...register('about_bio')}
                        rows={4}
                        placeholder="A description of this person's personality, character, and qualities…"
                      />
                    </div>
                    <div>
                      <Label>Looking For</Label>
                      <Textarea
                        {...register('looking_for')}
                        rows={3}
                        placeholder="What qualities and background they are seeking in a spouse…"
                      />
                    </div>
                    <div>
                      <Label>Future Plans</Label>
                      <Textarea
                        {...register('plans')}
                        rows={2}
                        placeholder="Where they plan to live, learning vs. working, etc."
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Photo URL</Label>
                        <Input
                          {...register('photo_url')}
                          type="url"
                          placeholder="https://…"
                        />
                      </div>
                      <div>
                        <Label>Résumé URL</Label>
                        <Input
                          {...register('resume_url')}
                          type="url"
                          placeholder="https://…"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Step 6: Privacy & Review */}
              {currentStep === 6 && (
                <>
                  <h2 className="text-base font-semibold text-[#1A1A1A]">Privacy & Review</h2>
                  <div className="space-y-5">
                    <div>
                      <Label>Status</Label>
                      <select {...register('status')} className="input-base w-full">
                        <option value="draft">Draft – not visible to others</option>
                        <option value="available">Available – active on platform</option>
                      </select>
                    </div>
                    <div>
                      <Label>Pledge Amount ($)</Label>
                      <Input
                        {...register('pledge_amount', { valueAsNumber: true })}
                        type="number"
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Privacy Settings</Label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          {...register('privacy_show_photo')}
                          className="accent-brand-maroon w-4 h-4"
                        />
                        <span className="text-sm text-[#555555]">Show photo to other shadchanim</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          {...register('privacy_show_contact')}
                          className="accent-brand-maroon w-4 h-4"
                        />
                        <span className="text-sm text-[#555555]">Show contact info to other shadchanim</span>
                      </label>
                    </div>

                    {/* Summary */}
                    <div className="rounded-xl bg-[#FAFAFA] border border-gray-200 p-4 space-y-2">
                      <p className="text-sm font-semibold text-[#1A1A1A] mb-3">Review Summary</p>
                      {[
                        { label: 'Name', value: `${watch('first_name') || '—'} ${watch('last_name') || ''}` },
                        { label: 'Hebrew Name', value: watch('full_hebrew_name') || '—' },
                        { label: 'Gender', value: watch('gender') ? watch('gender').charAt(0).toUpperCase() + watch('gender').slice(1) : '—' },
                        { label: 'Date of Birth', value: watch('dob') || '—' },
                        { label: 'City', value: watch('city') || '—' },
                        { label: 'Hashkafa', value: watch('hashkafa') || '—' },
                        { label: 'Status', value: watch('status') === 'available' ? 'Available' : 'Draft' },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex items-start gap-2 text-sm">
                          <span className="text-[#888888] w-32 flex-shrink-0">{label}</span>
                          <span className="text-[#1A1A1A] font-medium">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <Button
                type="button"
                variant="secondary"
                onClick={back}
                disabled={currentStep === 0}
              >
                Back
              </Button>
              {currentStep < wizardSteps.length - 1 ? (
                <Button type="button" variant="primary" onClick={next}>
                  Next
                </Button>
              ) : (
                <Button type="submit" variant="pink">
                  Save Single
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  )
}
