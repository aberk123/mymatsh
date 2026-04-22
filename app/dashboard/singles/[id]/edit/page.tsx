'use client'

import { useParams } from 'next/navigation'
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
import { StatusBadge } from '@/components/ui/badge'
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
  status: 'draft' | 'available' | 'on_hold' | 'engaged' | 'inactive'
  pledge_amount: number
  privacy_show_photo: boolean
  privacy_show_contact: boolean
}

const prefilled: FormValues = {
  first_name: 'Yosef',
  last_name: 'Goldstein',
  full_hebrew_name: 'יוסף בן אברהם',
  gender: 'male',
  dob: '1999-03-14',
  age: 26,
  phone: '(718) 555-0142',
  email: 'yosef@example.com',
  address: '456 Ocean Pkwy, Apt 3A',
  city: 'Brooklyn',
  state: 'NY',
  country: 'USA',
  postal_code: '11218',
  height_feet: 5,
  height_inches_rem: 11,
  current_education: 'Beis Medrash Govoha – Kollel',
  occupation: '',
  high_schools: 'Yeshiva Torah Temimah (2013–2017)',
  eretz_yisroel: '2 years – Mir Yerushalayim',
  current_yeshiva_seminary: 'Beis Medrash Govoha',
  family_background: 'Father is a well-respected Rav in Flatbush. Mother is a principal at a local Bais Yaakov.',
  siblings: '4 siblings – 2 brothers (both in kollel), 2 sisters',
  hashkafa: 'yeshivish',
  about_bio: 'Yosef is a warm, thoughtful young man who values Torah learning and family.',
  looking_for: 'Someone warm and family-oriented, who values Torah as the center of home life.',
  plans: 'Plans to learn in kollel for several years after marriage.',
  photo_url: '',
  resume_url: '',
  status: 'available',
  pledge_amount: 5000,
  privacy_show_photo: true,
  privacy_show_contact: false,
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-maroon mt-8 mb-4 first:mt-0 pb-2 border-b border-gray-100">
      {children}
    </h2>
  )
}

export default function EditSinglePage() {
  const params = useParams()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: prefilled })

  const onSubmit = (data: FormValues) => {
    const heightInches = data.height_feet * 12 + data.height_inches_rem
    console.log('Saving single:', { id: params.id, ...data, height_inches: heightInches })
  }

  const watchedGender = watch('gender')

  return (
    <AppLayout navItems={navItems} title="Edit Single" role="shadchan">
      {/* Back */}
      <div className="mb-4">
        <Link
          href={`/dashboard/singles/${params.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-[#555555] hover:text-brand-maroon transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Profile
        </Link>
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-[#1A1A1A]">Edit Single</h1>
            <p className="text-sm text-[#555555] mt-1">
              {prefilled.first_name} {prefilled.last_name} &nbsp;·&nbsp;
              <StatusBadge status={prefilled.status} className="text-xs" />
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="card space-y-1">

            {/* Basic Info */}
            <SectionTitle>Basic Information</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label required>First Name</Label>
                <Input
                  {...register('first_name', { required: 'Required' })}
                  error={errors.first_name?.message}
                />
              </div>
              <div>
                <Label required>Last Name</Label>
                <Input
                  {...register('last_name', { required: 'Required' })}
                  error={errors.last_name?.message}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Full Hebrew Name</Label>
                <Input {...register('full_hebrew_name')} dir="auto" />
              </div>
              <div className="sm:col-span-2">
                <Label required>Gender</Label>
                <div className="flex gap-4 mt-1">
                  {(['male', 'female'] as const).map((g) => (
                    <label key={g} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value={g}
                        {...register('gender')}
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
                <Input type="number" {...register('age', { valueAsNumber: true, min: 18, max: 99 })} />
              </div>
            </div>

            {/* Contact */}
            <SectionTitle>Contact Information</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Phone</Label>
                <Input {...register('phone')} type="tel" />
              </div>
              <div>
                <Label>Email</Label>
                <Input {...register('email')} type="email" />
              </div>
              <div className="sm:col-span-2">
                <Label>Street Address</Label>
                <Input {...register('address')} />
              </div>
              <div>
                <Label>City</Label>
                <Input {...register('city')} />
              </div>
              <div>
                <Label>State</Label>
                <Input {...register('state')} />
              </div>
              <div>
                <Label>Country</Label>
                <Input {...register('country')} />
              </div>
              <div>
                <Label>Postal Code</Label>
                <Input {...register('postal_code')} />
              </div>
            </div>

            {/* Physical */}
            <SectionTitle>Physical</SectionTitle>
            <div>
              <Label>Height</Label>
              <div className="flex gap-3 mt-1">
                <select {...register('height_feet', { valueAsNumber: true })} className="input-base flex-1">
                  {[4, 5, 6, 7].map((f) => <option key={f} value={f}>{f} ft</option>)}
                </select>
                <select {...register('height_inches_rem', { valueAsNumber: true })} className="input-base flex-1">
                  {Array.from({ length: 12 }, (_, i) => <option key={i} value={i}>{i} in</option>)}
                </select>
              </div>
            </div>

            {/* Education */}
            <SectionTitle>Education & Occupation</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Current Education</Label>
                <Input {...register('current_education')} />
              </div>
              <div>
                <Label>Occupation</Label>
                <Input {...register('occupation')} />
              </div>
              <div className="sm:col-span-2">
                <Label>High Schools</Label>
                <Textarea {...register('high_schools')} rows={2} />
              </div>
              <div>
                <Label>Time in Eretz Yisroel</Label>
                <Input {...register('eretz_yisroel')} />
              </div>
              <div>
                <Label>{watchedGender === 'female' ? 'Current Seminary' : 'Current Yeshiva'}</Label>
                <Input {...register('current_yeshiva_seminary')} />
              </div>
            </div>

            {/* Background */}
            <SectionTitle>Background</SectionTitle>
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
                <Textarea {...register('family_background')} rows={4} />
              </div>
              <div>
                <Label>Siblings</Label>
                <Textarea {...register('siblings')} rows={2} />
              </div>
            </div>

            {/* Profile */}
            <SectionTitle>Profile Details</SectionTitle>
            <div className="space-y-4">
              <div>
                <Label>Bio</Label>
                <Textarea {...register('about_bio')} rows={4} />
              </div>
              <div>
                <Label>Looking For</Label>
                <Textarea {...register('looking_for')} rows={3} />
              </div>
              <div>
                <Label>Future Plans</Label>
                <Textarea {...register('plans')} rows={2} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Photo URL</Label>
                  <Input {...register('photo_url')} type="url" placeholder="https://…" />
                </div>
                <div>
                  <Label>Résumé URL</Label>
                  <Input {...register('resume_url')} type="url" placeholder="https://…" />
                </div>
              </div>
            </div>

            {/* Privacy & Status */}
            <SectionTitle>Status & Privacy</SectionTitle>
            <div className="space-y-4">
              <div>
                <Label>Status</Label>
                <select {...register('status')} className="input-base w-full">
                  <option value="draft">Draft</option>
                  <option value="available">Available</option>
                  <option value="on_hold">On Hold</option>
                  <option value="engaged">Engaged</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <Label>Pledge Amount ($)</Label>
                <Input {...register('pledge_amount', { valueAsNumber: true })} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Privacy Settings</Label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" {...register('privacy_show_photo')} className="accent-brand-maroon w-4 h-4" />
                  <span className="text-sm text-[#555555]">Show photo to other shadchanim</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" {...register('privacy_show_contact')} className="accent-brand-maroon w-4 h-4" />
                  <span className="text-sm text-[#555555]">Show contact info to other shadchanim</span>
                </label>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 mt-6">
            <Link href={`/dashboard/singles/${params.id}`}>
              <Button type="button" variant="secondary">Cancel</Button>
            </Link>
            <Button type="submit" variant="primary">
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}
