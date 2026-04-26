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
  ExternalLink,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUnreadMessageCount } from '@/lib/use-unread-messages'
import { AppLayout } from '@/components/ui/app-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { WizardProgress, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import type { NavItem } from '@/components/ui/sidebar'

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

interface DuplicateRecord {
  id: string
  first_name: string
  last_name: string
  age: number | null
  dob: string | null
  phone: string | null
  city: string | null
  state: string | null
  address: string | null
  height_inches: number | null
  current_yeshiva_seminary: string | null
  eretz_yisroel: string | null
  plans: string | null
  looking_for: string | null
  family_background: string | null
  siblings: string | null
  about_bio: string | null
  photo_url: string | null
}

const MERGE_FIELDS_UI: Array<{
  key: string
  label: string
  format?: (v: unknown) => string
}> = [
  { key: 'phone', label: 'Phone' },
  { key: 'dob', label: 'Date of Birth' },
  { key: 'age', label: 'Age' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'address', label: 'Address' },
  {
    key: 'height_inches', label: 'Height',
    format: (v) => v ? `${Math.floor(Number(v) / 12)}'${Number(v) % 12}"` : '',
  },
  { key: 'current_yeshiva_seminary', label: 'Yeshiva / Seminary' },
  { key: 'eretz_yisroel', label: 'Eretz Yisroel' },
  { key: 'plans', label: 'Plans' },
  { key: 'looking_for', label: 'Looking For' },
  { key: 'family_background', label: 'Family Background' },
  { key: 'siblings', label: 'Siblings' },
  { key: 'about_bio', label: 'About / Bio' },
  { key: 'photo_url', label: 'Photo URL' },
]

function getNewFieldValue(key: string, data: FormValues): unknown {
  if (key === 'height_inches') {
    const hi = (data.height_feet || 0) * 12 + (data.height_inches_rem || 0)
    return hi > 0 ? hi : null
  }
  const v = (data as Record<string, unknown>)[key]
  return v !== undefined && v !== '' && v !== null ? v : null
}

function displayValue(key: string, value: unknown, format?: (v: unknown) => string): string {
  if (value === null || value === undefined || value === '') return '—'
  if (format) return format(value) || '—'
  const str = String(value)
  return str.length > 100 ? str.slice(0, 100) + '…' : str
}

function initMergeSelections(existing: DuplicateRecord, data: FormValues): Record<string, 'existing' | 'new'> {
  const sel: Record<string, 'existing' | 'new'> = {}
  for (const { key } of MERGE_FIELDS_UI) {
    const ev = (existing as unknown as Record<string, unknown>)[key]
    const nv = getNewFieldValue(key, data)
    const hasE = ev !== null && ev !== undefined && ev !== ''
    const hasN = nv !== null && nv !== undefined && nv !== ''
    if (hasE || hasN) {
      sel[key] = hasE ? 'existing' : 'new'
    }
  }
  return sel
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

function AiBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-yellow-700 bg-yellow-50 border border-yellow-200 px-1.5 py-0.5 rounded-full leading-none">
      <Sparkles className="h-2.5 w-2.5" />
      AI
    </span>
  )
}

export default function NewSinglePage() {
  const unreadMsgCount = useUnreadMessageCount()
  const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'My Singles', href: '/dashboard/singles', icon: Users },
    { label: 'Suggestions', href: '/dashboard/matches', icon: Heart },
    { label: 'Calendar', href: '/dashboard/tasks', icon: CalendarCheck },
    { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare, ...(unreadMsgCount > 0 ? { badge: String(unreadMsgCount) } : {}) },
    { label: 'Groups', href: '/dashboard/groups', icon: UsersRound },
    { label: 'My Profile', href: '/dashboard/profile', icon: UserCircle },
  ]

  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [familiarityPopup, setFamiliarityPopup] = useState<string | null>(null)

  // Duplicate detection state
  const [detectedDuplicate, setDetectedDuplicate] = useState<DuplicateRecord | null>(null)
  const [dupModalOpen, setDupModalOpen] = useState(false)
  const [dupMergeMode, setDupMergeMode] = useState(false)
  const [mergeSelections, setMergeSelections] = useState<Record<string, 'existing' | 'new'>>({})
  const [pendingFormData, setPendingFormData] = useState<FormValues | null>(null)
  const [merging, setMerging] = useState(false)

  // Resume AI state
  const [resumeParsing, setResumeParsing] = useState(false)
  const [resumeParseError, setResumeParseError] = useState('')
  const [resumeFieldsFilled, setResumeFieldsFilled] = useState(0)
  const [resumeFileName, setResumeFileName] = useState('')
  const [aiFilledFields, setAiFilledFields] = useState<Set<string>>(new Set())
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
    setAiFilledFields(new Set())

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
      const filled = new Set<string>()

      for (const [claudeKey, formKey] of Object.entries(FIELD_MAP)) {
        if (!formKey) continue
        const val = fields[claudeKey]
        if (val && typeof val === 'string' && val.trim()) {
          setValue(formKey as keyof FormValues, val.trim() as never)
          filled.add(formKey)
          count++
        }
      }

      const genderVal = fields.gender
      if (genderVal === 'male' || genderVal === 'female') {
        setValue('gender', genderVal)
        filled.add('gender')
        count++
      }

      const ageVal = fields.age
      if (typeof ageVal === 'number' && ageVal > 0) {
        setValue('age', ageVal)
        filled.add('age')
        count++
      }

      const hInches = fields.height_inches
      if (typeof hInches === 'number' && hInches > 0) {
        setValue('height_feet', Math.floor(hInches / 12))
        setValue('height_inches_rem', hInches % 12)
        filled.add('height_feet')
        count++
      }

      const hashkafaVal = fields.hashkafa
      if (hashkafaVal && typeof hashkafaVal === 'string') {
        setValue('hashkafa', normalizeHashkafa(hashkafaVal))
        filled.add('hashkafa')
        count++
      }

      if (json.resumeUrl) {
        setValue('resume_url', json.resumeUrl)
      }

      setResumeFieldsFilled(count)
      setAiFilledFields(filled)
    } catch {
      setResumeParseError('Network error. Please try again.')
    } finally {
      setResumeParsing(false)
      if (resumeInputRef.current) resumeInputRef.current.value = ''
    }
  }

  // Real-time duplicate detection: trigger when name + (phone or dob) are all filled
  const watchedFirst = watch('first_name')
  const watchedLast = watch('last_name')
  const watchedPhone = watch('phone')
  const watchedDob = watch('dob')

  useEffect(() => {
    const firstName = watchedFirst?.trim() ?? ''
    const lastName = watchedLast?.trim() ?? ''
    const phone = watchedPhone?.trim() ?? ''
    const dob = watchedDob?.trim() ?? ''

    if (!firstName || !lastName || (!phone && !dob)) {
      setDetectedDuplicate(null)
      return
    }

    const timer = setTimeout(async () => {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('singles') as any)
        .select('id, first_name, last_name, age, dob, phone, city, state, address, height_inches, current_yeshiva_seminary, eretz_yisroel, plans, looking_for, family_background, siblings, about_bio, photo_url')
        .ilike('first_name', firstName)
        .ilike('last_name', lastName)
        .limit(1) as { data: DuplicateRecord[] | null }

      if (data && data.length > 0) {
        setDetectedDuplicate(data[0])
      } else {
        setDetectedDuplicate(null)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [watchedFirst, watchedLast, watchedPhone, watchedDob])

  async function doSaveNew(data: FormValues) {
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
      const json = await res.json() as { id: string }
      setDupModalOpen(false)
      setFamiliarityPopup(json.id)
    } catch {
      setSaveError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  function openMergeComparison() {
    if (!detectedDuplicate || !pendingFormData) return
    setMergeSelections(initMergeSelections(detectedDuplicate, pendingFormData))
    setDupMergeMode(true)
  }

  async function doMerge() {
    if (!detectedDuplicate || !pendingFormData) return
    setMerging(true)
    setSaveError('')

    const updates: Record<string, unknown> = {}
    for (const { key } of MERGE_FIELDS_UI) {
      if (mergeSelections[key] === 'new') {
        updates[key] = getNewFieldValue(key, pendingFormData)
      }
    }

    try {
      const res = await fetch(`/api/singles/${detectedDuplicate.id}/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      })
      if (!res.ok) {
        const json = await res.json()
        setSaveError(json.error ?? 'Merge failed. Please try again.')
        return
      }
      setDupModalOpen(false)
      setDupMergeMode(false)
      setFamiliarityPopup(detectedDuplicate.id)
    } catch {
      setSaveError('Network error. Please try again.')
    } finally {
      setMerging(false)
    }
  }

  const onSubmit = async (data: FormValues) => {
    if (detectedDuplicate) {
      setPendingFormData(data)
      setDupMergeMode(false)
      setDupModalOpen(true)
      return
    }
    await doSaveNew(data)
  }

  const next = () => setCurrentStep((s) => Math.min(s + 1, wizardSteps.length - 1))
  const back = () => setCurrentStep((s) => Math.max(s - 1, 0))

  const watchedGender = watch('gender')

  // Build comparison rows for the merge table
  const mergeRows = detectedDuplicate && pendingFormData
    ? MERGE_FIELDS_UI.filter(({ key }) => {
        const ev = (detectedDuplicate as unknown as Record<string, unknown>)[key]
        const nv = getNewFieldValue(key, pendingFormData)
        return (ev !== null && ev !== undefined && ev !== '') || (nv !== null && nv !== undefined && nv !== '')
      })
    : []

  return (
    <AppLayout navItems={navItems} title="Add New Single" role="shadchan">
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
                  capture="environment"
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

        {saveError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {saveError}
          </div>
        )}

        {/* Duplicate warning banner */}
        {detectedDuplicate && (
          <div className="mb-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-sm text-yellow-800 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5 text-yellow-600" />
            <span>
              A single with a similar name already exists in the database. Please review before saving.{' '}
              <a
                href={`/dashboard/singles/${detectedDuplicate.id}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-0.5 font-semibold underline underline-offset-2 hover:text-yellow-900"
              >
                View Existing Record
                <ExternalLink className="h-3 w-3" />
              </a>
            </span>
          </div>
        )}

        {/* Wizard */}
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
                      <div className="flex items-center gap-1.5">
                        <Label required>First Name</Label>
                        {aiFilledFields.has('first_name') && <AiBadge />}
                      </div>
                      <Input
                        {...register('first_name', { required: 'First name is required' })}
                        placeholder="e.g. Yosef"
                        error={errors.first_name?.message}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Label required>Last Name</Label>
                        {aiFilledFields.has('last_name') && <AiBadge />}
                      </div>
                      <Input
                        {...register('last_name', { required: 'Last name is required' })}
                        placeholder="e.g. Goldstein"
                        error={errors.last_name?.message}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <div className="flex items-center gap-1.5">
                        <Label>Full Hebrew Name</Label>
                        {aiFilledFields.has('full_hebrew_name') && <AiBadge />}
                      </div>
                      <Input
                        {...register('full_hebrew_name')}
                        placeholder="e.g. יוסף בן אברהם"
                        dir="auto"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <div className="flex items-center gap-1.5">
                        <Label required>Gender</Label>
                        {aiFilledFields.has('gender') && <AiBadge />}
                      </div>
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
                      <div className="flex items-center gap-1.5">
                        <Label>Date of Birth</Label>
                        {aiFilledFields.has('dob') && <AiBadge />}
                      </div>
                      <Input type="date" {...register('dob')} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Label>Age</Label>
                        {aiFilledFields.has('age') && <AiBadge />}
                      </div>
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
                      <div className="flex items-center gap-1.5">
                        <Label>Phone</Label>
                        {aiFilledFields.has('phone') && <AiBadge />}
                      </div>
                      <Input {...register('phone')} type="tel" placeholder="(718) 555-0100" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Label>Email</Label>
                        {aiFilledFields.has('email') && <AiBadge />}
                      </div>
                      <Input {...register('email')} type="email" placeholder="name@example.com" />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Street Address</Label>
                      <Input {...register('address')} placeholder="123 Main St, Apt 4B" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Label>City</Label>
                        {aiFilledFields.has('city') && <AiBadge />}
                      </div>
                      <Input {...register('city')} placeholder="Brooklyn" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Label>State</Label>
                        {aiFilledFields.has('state') && <AiBadge />}
                      </div>
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
                      <div className="flex items-center gap-1.5">
                        <Label>Height</Label>
                        {aiFilledFields.has('height_feet') && <AiBadge />}
                      </div>
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
                      <div className="flex items-center gap-1.5">
                        <Label>Occupation</Label>
                        {aiFilledFields.has('occupation') && <AiBadge />}
                      </div>
                      <Input
                        {...register('occupation')}
                        placeholder="e.g. Software Engineer"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <div className="flex items-center gap-1.5">
                        <Label>High Schools Attended</Label>
                        {aiFilledFields.has('high_schools') && <AiBadge />}
                      </div>
                      <Textarea
                        {...register('high_schools')}
                        rows={2}
                        placeholder="List high schools attended, one per line"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Label>Time in Eretz Yisroel</Label>
                        {aiFilledFields.has('eretz_yisroel') && <AiBadge />}
                      </div>
                      <Input
                        {...register('eretz_yisroel')}
                        placeholder="e.g. 2 years – Mir Yerushalayim"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Label>
                          {watchedGender === 'female' ? 'Current Seminary' : 'Current Yeshiva'}
                        </Label>
                        {aiFilledFields.has('current_yeshiva_seminary') && <AiBadge />}
                      </div>
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
                      <div className="flex items-center gap-1.5">
                        <Label>Hashkafa</Label>
                        {aiFilledFields.has('hashkafa') && <AiBadge />}
                      </div>
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
                      <div className="flex items-center gap-1.5">
                        <Label>Family Background</Label>
                        {aiFilledFields.has('family_background') && <AiBadge />}
                      </div>
                      <Textarea
                        {...register('family_background')}
                        rows={4}
                        placeholder="Describe family background, upbringing, community…"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Label>Siblings</Label>
                        {aiFilledFields.has('siblings') && <AiBadge />}
                      </div>
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
                      <div className="flex items-center gap-1.5">
                        <Label>About / Bio</Label>
                        {aiFilledFields.has('about_bio') && <AiBadge />}
                      </div>
                      <Textarea
                        {...register('about_bio')}
                        rows={4}
                        placeholder="A description of this person's personality, character, and qualities…"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Label>Looking For</Label>
                        {aiFilledFields.has('looking_for') && <AiBadge />}
                      </div>
                      <Textarea
                        {...register('looking_for')}
                        rows={3}
                        placeholder="What qualities and background they are seeking in a spouse…"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Label>Future Plans</Label>
                        {aiFilledFields.has('plans') && <AiBadge />}
                      </div>
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
        </div>
      </div>

      {/* Duplicate resolution modal */}
      <Dialog
        open={dupModalOpen}
        onOpenChange={(open) => {
          if (!open) { setDupModalOpen(false); setDupMergeMode(false) }
        }}
      >
        <DialogContent className={dupMergeMode ? 'max-w-2xl' : 'max-w-md'}>
          <DialogHeader>
            <DialogTitle>
              {dupMergeMode ? 'Merge into Existing Record' : 'Possible Duplicate Found'}
            </DialogTitle>
          </DialogHeader>

          {!dupMergeMode ? (
            <>
              <div className="px-6 pb-2 space-y-3">
                <p className="text-sm text-[#555555]">
                  A single named{' '}
                  <span className="font-semibold text-[#1A1A1A]">
                    {detectedDuplicate ? `${detectedDuplicate.first_name} ${detectedDuplicate.last_name}` : ''}
                  </span>{' '}
                  already exists in the database. How would you like to proceed?
                </p>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2 px-6 pb-4">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => { setDupModalOpen(false); setDupMergeMode(false) }}
                  disabled={saving || merging}
                >
                  Cancel
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={openMergeComparison}
                  disabled={saving || merging}
                >
                  Merge into Existing Record
                </Button>
                <Button
                  variant="pink"
                  size="md"
                  disabled={saving || merging}
                  onClick={() => pendingFormData && doSaveNew(pendingFormData)}
                >
                  {saving ? 'Saving…' : 'Save as New Single'}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <div className="px-6 pb-2">
                <p className="text-xs text-[#888888] mb-3">
                  Select which value to keep for each field. The chosen values will overwrite the existing record.
                </p>
                <div className="overflow-y-auto max-h-[55vh] border border-gray-100 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-[#888888] uppercase tracking-wide w-28">Field</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-[#888888] uppercase tracking-wide">Existing Record</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-[#888888] uppercase tracking-wide">New Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mergeRows.map(({ key, label, format }) => {
                        const existingRaw = (detectedDuplicate as unknown as Record<string, unknown>)[key]
                        const newRaw = pendingFormData ? getNewFieldValue(key, pendingFormData) : null
                        const hasE = existingRaw !== null && existingRaw !== undefined && existingRaw !== ''
                        const hasN = newRaw !== null && newRaw !== undefined && newRaw !== ''
                        const selectedExisting = mergeSelections[key] === 'existing'
                        const selectedNew = mergeSelections[key] === 'new'

                        return (
                          <tr key={key} className="border-b border-gray-50 last:border-0">
                            <td className="px-3 py-2.5 text-xs font-medium text-[#888888] align-top whitespace-nowrap">{label}</td>
                            <td className="px-2 py-1.5 align-top">
                              <label
                                className={`flex items-start gap-2 cursor-pointer rounded-md px-2 py-1.5 transition-colors ${
                                  hasE
                                    ? selectedExisting
                                      ? 'bg-brand-maroon/5 border border-brand-maroon/30'
                                      : 'hover:bg-gray-50'
                                    : 'opacity-40 cursor-not-allowed'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={key}
                                  value="existing"
                                  disabled={!hasE}
                                  checked={selectedExisting}
                                  onChange={() => setMergeSelections(prev => ({ ...prev, [key]: 'existing' }))}
                                  className="mt-0.5 accent-brand-maroon flex-shrink-0"
                                />
                                <span className="text-xs text-[#1A1A1A] break-words">
                                  {displayValue(key, existingRaw, format)}
                                </span>
                              </label>
                            </td>
                            <td className="px-2 py-1.5 align-top">
                              <label
                                className={`flex items-start gap-2 cursor-pointer rounded-md px-2 py-1.5 transition-colors ${
                                  hasN
                                    ? selectedNew
                                      ? 'bg-brand-maroon/5 border border-brand-maroon/30'
                                      : 'hover:bg-gray-50'
                                    : 'opacity-40 cursor-not-allowed'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={key}
                                  value="new"
                                  disabled={!hasN}
                                  checked={selectedNew}
                                  onChange={() => setMergeSelections(prev => ({ ...prev, [key]: 'new' }))}
                                  className="mt-0.5 accent-brand-maroon flex-shrink-0"
                                />
                                <span className="text-xs text-[#1A1A1A] break-words">
                                  {displayValue(key, newRaw, format)}
                                </span>
                              </label>
                            </td>
                          </tr>
                        )
                      })}
                      {mergeRows.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-3 py-6 text-center text-sm text-[#888888]">
                            No differing fields to compare.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setDupMergeMode(false)}
                  disabled={merging}
                >
                  Back
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  disabled={merging}
                  onClick={doMerge}
                >
                  {merging ? 'Merging…' : 'Confirm Merge'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Familiarity popup — shown after both new creation and merge */}
      <Dialog open={familiarityPopup !== null} onOpenChange={(open) => { if (!open) { setFamiliarityPopup(null); router.push('/dashboard/singles') } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Are you familiar with this single?</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-2">
            <p className="text-sm text-[#555555]">
              Are you personally familiar with this single — do you know them, their family, or their background?
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="secondary" onClick={async () => {
              if (familiarityPopup) {
                await fetch(`/api/singles/${familiarityPopup}/familiarity`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ is_familiar: false }),
                })
              }
              setFamiliarityPopup(null)
              router.push('/dashboard/singles')
            }}>
              No
            </Button>
            <Button variant="primary" onClick={async () => {
              if (familiarityPopup) {
                await fetch(`/api/singles/${familiarityPopup}/familiarity`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ is_familiar: true }),
                })
              }
              setFamiliarityPopup(null)
              router.push('/dashboard/singles')
            }}>
              Yes, I Know Them
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
