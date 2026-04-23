'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  AlertTriangle,
  CheckCircle,
  FileText,
  Sparkles,
  Loader2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
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

// Map Claude field names → form field names
const FIELD_MAP: Partial<Record<string, keyof FormValues>> = {
  first_name: 'first_name',
  last_name: 'last_name',
  full_hebrew_name: 'full_hebrew_name',
  phone: 'phone',
  email: 'email',
  city: 'city',
  state: 'state',
  dob: 'dob',
  about_me: 'about_bio',
  looking_for: 'looking_for',
  plans: 'plans',
  family_background: 'family_background',
  siblings: 'siblings',
  occupation: 'occupation',
  current_yeshiva_seminary: 'current_yeshiva_seminary',
  eretz_yisroel: 'eretz_yisroel',
  previous_yeshivos: 'high_schools',
}

const HASHKAFA_MAP: Record<string, string> = {
  yeshivish: 'yeshivish',
  'yeshivish black hat': 'yeshivish',
  'modern orthodox': 'modern_orthodox',
  'modern_orthodox': 'modern_orthodox',
  'mlo': 'modern_orthodox',
  chassidish: 'chassidish',
  chasidish: 'chassidish',
  hasidic: 'chassidish',
  sephardic: 'sephardic',
  sefardic: 'sephardic',
  'baal teshuva': 'baal_teshuva',
  'baal_teshuva': 'baal_teshuva',
  bt: 'baal_teshuva',
}

function normalizeHashkafa(raw: string): string {
  const lower = raw.toLowerCase().trim()
  for (const [key, val] of Object.entries(HASHKAFA_MAP)) {
    if (lower.includes(key)) return val
  }
  return 'other'
}

export default function NewSinglePage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [dupWarning, setDupWarning] = useState<string | null>(null)
  const [mergeResult, setMergeResult] = useState<{ id: string; fields_added: string[]; fields_skipped: string[] } | null>(null)

  // Resume AI state
  const [resumeParsing, setResumeParsing] = useState(false)
  const [resumeParseError, setResumeParseError] = useState('')
  const [resumeFieldsFilled, setResumeFieldsFilled] = useState(0)
  const [resumeFileName, setResumeFileName] = useState('')
  const resumeInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
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

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setResumeParseError('')
    setResumeFieldsFilled(0)
    setResumeFileName(file.name)
    setResumeParsing(true)

    try {
      const formData = new FormData()
      formData.append('resume', file)
      const res = await fetch('/api/singles/parse-resume', { method: 'POST', body: formData })
      const json = await res.json()
      if (!res.ok) {
        setResumeParseError(json.error ?? 'Resume parsing failed.')
        return
      }

      const fields = json.fields as Record<string, unknown>
      let count = 0

      // Standard field map
      for (const [claudeKey, formKey] of Object.entries(FIELD_MAP)) {
        const val = fields[claudeKey]
        if (val && typeof val === 'string' && val.trim()) {
          setValue(formKey as keyof FormValues, val.trim() as never)
          count++
        }
      }

      // Gender
      const genderVal = fields.gender
      if (genderVal === 'male' || genderVal === 'female') {
        setValue('gender', genderVal)
        count++
      }

      // Age (integer)
      const ageVal = fields.age
      if (typeof ageVal === 'number' && ageVal > 0) {
        setValue('age', ageVal)
        count++
      }

      // Height: split total inches into feet + remainder
      const hInches = fields.height_inches
      if (typeof hInches === 'number' && hInches > 0) {
        setValue('height_feet', Math.floor(hInches / 12))
        setValue('height_inches_rem', hInches % 12)
        count++
      }

      // Hashkafa: normalize to select value
      const hashkafaVal = fields.hashkafa
      if (hashkafaVal && typeof hashkafaVal === 'string') {
        setValue('hashkafa', normalizeHashkafa(hashkafaVal))
        count++
      }

      // Resume URL from storage upload
      if (json.resumeUrl) {
        setValue('resume_url', json.resumeUrl)
      }

      setResumeFieldsFilled(count)
    } catch {
      setResumeParseError('Network error. Please try again.')
    } finally {
      setResumeParsing(false)
      // Reset input so same file can be re-uploaded
      if (resumeInputRef.current) resumeInputRef.current.value = ''
    }
  }

  const onSubmit = async (data: FormValues) => {
    setSaving(true)
    setSaveError('')
    const heightInches = data.height_feet * 12 + data.height_inches_rem
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { height_feet, height_inches_rem, privacy_show_photo, privacy_show_contact, ...rest } = data
    try {
      const res = await fetch('/api/singles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...rest,
          height_inches: heightInches,
          privacy_settings: { show_photo: privacy_show_photo, show_contact: privacy_show_contact },
        }),
      })
      if (!res.ok) {
        const json = await res.json()
        setSaveError(json.error ?? 'Failed to save. Please try again.')
        return
      }
      const json = await res.json() as {
        id: string
        status: 'created' | 'merged'
        fields_added?: string[]
        fields_skipped?: string[]
      }
      if (json.status === 'merged') {
        setMergeResult({ id: json.id, fields_added: json.fields_added ?? [], fields_skipped: json.fields_skipped ?? [] })
        return
      }
      router.push('/dashboard/singles')
    } catch {
      setSaveError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const next = () => setCurrentStep((s) => Math.min(s + 1, wizardSteps.length - 1))
  const back = () => setCurrentStep((s) => Math.max(s - 1, 0))

  const watchedGender = watch('gender')
  const watchedFirst = watch('first_name')
  const watchedLast = watch('last_name')

  useEffect(() => {
    if (!watchedFirst?.trim() || !watchedLast?.trim()) { setDupWarning(null); return }
    const timer = setTimeout(async () => {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('singles') as any)
        .select('id, first_name, last_name')
        .ilike('first_name', watchedFirst.trim())
        .ilike('last_name', watchedLast.trim())
        .limit(1) as { data: Array<{ id: string; first_name: string; last_name: string }> | null }
      if (data && data.length > 0) {
        setDupWarning(`${data[0].first_name} ${data[0].last_name}`)
      } else {
        setDupWarning(null)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [watchedFirst, watchedLast])

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

        {/* Resume Upload Card */}
        {!mergeResult && (
          <div className="card p-5 mb-5">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-yellow-50 border border-yellow-200 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-4 w-4 text-yellow-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1A1A1A]">Quick Start: Upload Shidduch Résumé</p>
                <p className="text-xs text-[#888888] mt-0.5">
                  Upload a PDF or image and Claude AI will pre-fill the form fields automatically.
                </p>

                {resumeFieldsFilled > 0 && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-green-700 font-medium">
                    <CheckCircle className="h-3.5 w-3.5" />
                    {resumeFieldsFilled} field{resumeFieldsFilled !== 1 ? 's' : ''} pre-filled from{' '}
                    <span className="font-semibold truncate max-w-[160px]">{resumeFileName}</span>
                  </div>
                )}

                {resumeParseError && (
                  <p className="mt-2 text-xs text-red-600">{resumeParseError}</p>
                )}

                <div className="mt-3 flex items-center gap-3">
                  <input
                    ref={resumeInputRef}
                    id="resume-upload"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={handleResumeUpload}
                    disabled={resumeParsing}
                  />
                  <label
                    htmlFor="resume-upload"
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                      resumeParsing
                        ? 'bg-gray-50 border-gray-200 text-[#888888] cursor-not-allowed'
                        : 'bg-white border-gray-300 text-[#1A1A1A] hover:border-brand-maroon hover:text-brand-maroon'
                    }`}
                  >
                    {resumeParsing ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Parsing résumé…
                      </>
                    ) : (
                      <>
                        <FileText className="h-3.5 w-3.5" />
                        {resumeFieldsFilled > 0 ? 'Upload Different Résumé' : 'Choose Résumé File'}
                      </>
                    )}
                  </label>
                  <span className="text-xs text-[#AAAAAA]">PDF, JPG, PNG or WebP · max 10 MB</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {saveError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {saveError}
          </div>
        )}

        {dupWarning && !mergeResult && (
          <div className="mb-4 p-3 rounded-lg bg-orange-50 border border-orange-200 text-sm text-orange-700 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>
              A single named <span className="font-semibold">{dupWarning}</span> already exists on the platform.
              Please verify this is not a duplicate before saving.
            </span>
          </div>
        )}

        {mergeResult && (
          <div className="mb-6 p-5 rounded-xl bg-green-50 border border-green-200 space-y-4">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
              <p className="font-semibold text-sm">Merged into existing record</p>
            </div>
            <p className="text-sm text-green-800">
              This single already existed in the database. Your data was merged in — blank fields were filled, existing data was not overwritten.
            </p>
            {mergeResult.fields_added.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1.5">Fields added</p>
                <div className="flex flex-wrap gap-1.5">
                  {mergeResult.fields_added.map(f => (
                    <span key={f} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{f}</span>
                  ))}
                </div>
              </div>
            )}
            {mergeResult.fields_skipped.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[#888888] uppercase tracking-wide mb-1.5">Already filled (not overwritten)</p>
                <div className="flex flex-wrap gap-1.5">
                  {mergeResult.fields_skipped.map(f => (
                    <span key={f} className="text-xs bg-gray-100 text-[#555555] px-2 py-0.5 rounded-full">{f}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-3 pt-1">
              <Link href={`/dashboard/singles/${mergeResult.id}`}>
                <Button variant="primary" size="sm">View Existing Record</Button>
              </Link>
              <Link href="/dashboard/singles">
                <Button variant="secondary" size="sm">Back to My Singles</Button>
              </Link>
            </div>
          </div>
        )}

        {/* Wizard Progress */}
        {!mergeResult && <div className="card p-0 overflow-hidden">
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
                <Button type="submit" variant="pink" disabled={saving}>
                  {saving ? 'Saving…' : 'Save Single'}
                </Button>
              )}
            </div>
          </form>
        </div>}
      </div>
    </AppLayout>
  )
}
