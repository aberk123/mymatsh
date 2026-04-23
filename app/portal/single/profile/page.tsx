'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import {
  LayoutDashboard,
  UserCircle,
  Heart,
  MessageSquare,
  Pencil,
  X,
  Check,
  Tag,
  Upload,
  Trash2,
  Loader2,
  FileText,
  Sparkles,
  RotateCcw,
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar } from '@/components/ui/avatar'
import { StatusBadge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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

// Tracks a field that AI parsed: what it suggested and what was there before
interface AIParsedField {
  aiValue: string
  originalValue: string // empty string means the field was blank before AI filled it
}

// Extra info from the resume that doesn't map to editValues fields
interface AIRawData {
  siblings?: string
  references?: string
  raw_notes?: string
  father_name?: string
  father_occupation?: string
  mother_name?: string
  mother_occupation?: string
  previous_yeshivos?: string
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
  return `${Math.floor(inches / 12)}'${inches % 12}"`
}

function hsToString(val: unknown): string {
  if (!val) return ''
  if (typeof val === 'string') return val
  if (Array.isArray(val)) return val.join(', ')
  return ''
}

function centerSquareCrop(w: number, h: number): Crop {
  return centerCrop(makeAspectCrop({ unit: '%', width: 90 }, 1, w, h), w, h)
}

// ── Small AI badge shown next to field labels ─────────────────────────────────
function AiBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 ml-1.5 select-none">
      <Sparkles className="h-2.5 w-2.5" />AI
    </span>
  )
}

// ── Regular field row ─────────────────────────────────────────────────────────
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
  aiSuggested?: boolean
}

function FieldRow({
  label, value, editable = false, editMode = false,
  inputType = 'input', fieldKey = '', editValues = {}, onChange, hint, aiSuggested,
}: FieldRowProps) {
  const isEditing = editable && editMode
  return (
    <div className={`flex flex-col gap-1 py-3 border-b border-gray-100 last:border-0 ${aiSuggested ? 'bg-yellow-50 -mx-3 px-3 rounded' : ''}`}>
      <span className="field-label flex items-center flex-wrap">
        {label}
        {aiSuggested && <AiBadge />}
      </span>
      {isEditing ? (
        inputType === 'textarea' ? (
          <Textarea value={editValues[fieldKey] ?? value} onChange={e => onChange?.(fieldKey, e.target.value)} rows={3} className="input-base text-sm" />
        ) : (
          <>
            <Input type={inputType === 'date' ? 'date' : inputType === 'number' ? 'number' : 'text'} value={editValues[fieldKey] ?? value} onChange={e => onChange?.(fieldKey, e.target.value)} className="input-base" />
            {hint && <p className="text-xs text-[#888888] mt-0.5">{hint}</p>}
          </>
        )
      ) : (
        <p className="text-sm text-[#1A1A1A]">{value || '—'}</p>
      )}
    </div>
  )
}

// ── Conflict row: side-by-side comparison ─────────────────────────────────────
interface ConflictRowProps {
  label: string
  currentValue: string
  aiValue: string
  fieldKey: string
  inputType?: 'input' | 'textarea'
  onKeepCurrent: () => void
  onUseAi: () => void
}

function ConflictRow({ label, currentValue, aiValue, inputType = 'input', onKeepCurrent, onUseAi }: ConflictRowProps) {
  return (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="field-label">{label}</span>
        <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 select-none">Conflict</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="rounded-lg border border-gray-200 p-3">
          <p className="text-[10px] font-semibold text-[#888888] uppercase tracking-wide mb-1.5">Your current value</p>
          {inputType === 'textarea'
            ? <p className="text-sm text-[#1A1A1A] leading-snug whitespace-pre-wrap min-h-[3rem]">{currentValue || '—'}</p>
            : <p className="text-sm text-[#1A1A1A]">{currentValue || '—'}</p>}
          <button onClick={onKeepCurrent} className="mt-2 text-xs font-medium text-brand-maroon hover:underline">Keep this →</button>
        </div>
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
          <p className="text-[10px] font-semibold text-yellow-700 uppercase tracking-wide mb-1.5 flex items-center gap-1">
            <Sparkles className="h-2.5 w-2.5" />From resume
          </p>
          {inputType === 'textarea'
            ? <p className="text-sm text-[#1A1A1A] leading-snug whitespace-pre-wrap min-h-[3rem]">{aiValue}</p>
            : <p className="text-sm text-[#1A1A1A]">{aiValue}</p>}
          <button onClick={onUseAi} className="mt-2 text-xs font-medium text-yellow-700 hover:underline">Use resume value →</button>
        </div>
      </div>
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

  // Photo state
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [cropSrc, setCropSrc] = useState('')
  const [showCropModal, setShowCropModal] = useState(false)
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoError, setPhotoError] = useState('')
  const [photoRemoving, setPhotoRemoving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cropImgRef = useRef<HTMLImageElement>(null)

  // Resume / AI state
  const [resumeParsing, setResumeParsing] = useState(false)
  const [resumeError, setResumeError] = useState('')
  const [resumeUrl, setResumeUrl] = useState<string | null>(null)
  const [aiParsed, setAiParsed] = useState<Record<string, AIParsedField>>({})
  const [aiRawData, setAiRawData] = useState<AIRawData | null>(null)
  const resumeInputRef = useRef<HTMLInputElement>(null)

  // Labels state
  const [selfLabels, setSelfLabels] = useState<string[]>([])
  const [labelsEditMode, setLabelsEditMode] = useState(false)
  const [labelSearch, setLabelSearch] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: single } = await (supabase.from('singles') as any)
          .select('*').eq('user_id', user.id).maybeSingle()
        if (single) {
          setSingleId(single.id)
          setPhotoUrl(single.photo_url ?? null)
          setResumeUrl(single.resume_url ?? null)
          const hs = hsToString(single.high_schools)
          setProfile({
            first_name: single.first_name ?? '', last_name: single.last_name ?? '',
            full_hebrew_name: single.full_hebrew_name ?? '', gender: single.gender ?? '',
            dob: single.dob ?? '', age: single.age ?? null, height_inches: single.height_inches ?? null,
            address: single.address ?? '', city: single.city ?? '',
            state: single.state ?? '', country: single.country ?? '',
            phone: single.phone ?? user.phone ?? '', email: single.email ?? user.email ?? '',
            about_bio: single.about_bio ?? '', looking_for: single.looking_for ?? '',
            plans: single.plans ?? '', family_background: single.family_background ?? '',
            current_education: single.current_education ?? '',
            current_yeshiva_seminary: single.current_yeshiva_seminary ?? '',
            occupation: single.occupation ?? '', hashkafa: single.hashkafa ?? '',
            eretz_yisroel: single.eretz_yisroel ?? '', high_schools: hs,
            status: single.status ?? 'available',
          })
          setEditValues({
            first_name: single.first_name ?? '', last_name: single.last_name ?? '',
            full_hebrew_name: single.full_hebrew_name ?? '', gender: single.gender ?? '',
            dob: single.dob ?? '', age: single.age != null ? String(single.age) : '',
            height_inches: single.height_inches != null ? String(single.height_inches) : '',
            address: single.address ?? '', city: single.city ?? '',
            state: single.state ?? '', country: single.country ?? '',
            phone: single.phone ?? user.phone ?? '', email: single.email ?? user.email ?? '',
            about_bio: single.about_bio ?? '', looking_for: single.looking_for ?? '',
            plans: single.plans ?? '', family_background: single.family_background ?? '',
            current_education: single.current_education ?? '',
            current_yeshiva_seminary: single.current_yeshiva_seminary ?? '',
            occupation: single.occupation ?? '', hashkafa: single.hashkafa ?? '',
            eretz_yisroel: single.eretz_yisroel ?? '', high_schools: hs,
          })
          if (Array.isArray(single.self_labels)) setSelfLabels(single.self_labels)
        } else {
          const meta = user.user_metadata ?? {}
          const fn = (meta.first_name as string) ?? ''
          const ln = (meta.last_name as string) ?? ''
          const email = user.email ?? ''
          const phone = user.phone ?? ''
          setProfile(p => ({ ...p, first_name: fn, last_name: ln, email, phone }))
          setEditValues(v => ({ ...v, first_name: fn, last_name: ln, email, phone }))
        }
      }
      setLoading(false)
    })
  }, [])

  function handleChange(key: string, val: string) {
    setEditValues(prev => ({ ...prev, [key]: val }))
    // If user manually edits an AI-filled field, remove the AI badge for that field
    if (aiParsed[key] && aiParsed[key].originalValue === '') {
      setAiParsed(prev => { const n = { ...prev }; delete n[key]; return n })
    }
  }

  async function handleSave() {
    if (!singleId) { setSaveError('Profile record not found. Please contact support.'); return }
    setSaving(true); setSaveError('')
    try {
      const payload: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(editValues)) {
        if (k === 'height_inches') payload.height_inches = v !== '' ? (parseInt(v, 10) || null) : null
        else if (k === 'age') payload.age = v !== '' ? (parseInt(v, 10) || null) : null
        else if (k === 'high_schools') payload.high_schools = v.trim() ? v.split(',').map(s => s.trim()).filter(Boolean) : null
        else payload[k] = v !== '' ? v : null
      }
      const res = await fetch(`/api/singles/${singleId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
      if (!res.ok) { const j = await res.json(); setSaveError(j.error ?? 'Failed to save.'); return }
      setProfile(p => ({
        ...p, ...(editValues as unknown as Partial<Profile>),
        height_inches: payload.height_inches as number | null,
        age: payload.age as number | null,
        high_schools: editValues.high_schools,
      }))
      setAiParsed({}) // badges disappear after save
      setEditMode(false)
    } catch { setSaveError('Network error. Please try again.') }
    finally { setSaving(false) }
  }

  // ── Photo upload ─────────────────────────────────────────────────────────────

  function handlePhotoPickerClick() { setPhotoError(''); fileInputRef.current?.click() }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    e.target.value = ''
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setPhotoError('Only JPG, PNG and WebP supported.'); return }
    if (file.size > 5 * 1024 * 1024) { setPhotoError('Photo must be under 5 MB.'); return }
    const reader = new FileReader()
    reader.onload = () => { setCropSrc(reader.result as string); setCrop(undefined); setCompletedCrop(undefined); setShowCropModal(true) }
    reader.readAsDataURL(file)
  }

  function onCropImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget
    setCrop(centerSquareCrop(width, height))
  }

  const handleCropConfirm = useCallback(async () => {
    const img = cropImgRef.current
    if (!img || !completedCrop || completedCrop.width === 0) { setPhotoError('Please select a crop area.'); return }
    const canvas = document.createElement('canvas')
    const OUT = 400; canvas.width = OUT; canvas.height = OUT
    const ctx = canvas.getContext('2d')!
    const sx = img.naturalWidth / img.width; const sy = img.naturalHeight / img.height
    ctx.drawImage(img, completedCrop.x * sx, completedCrop.y * sy, completedCrop.width * sx, completedCrop.height * sy, 0, 0, OUT, OUT)
    const blob: Blob | null = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.92))
    if (!blob) { setPhotoError('Failed to process image.'); return }
    setShowCropModal(false); setPhotoUploading(true); setPhotoError('')
    try {
      const fd = new FormData(); fd.append('photo', blob, 'photo.jpg')
      const res = await fetch('/api/singles/upload-photo', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) { setPhotoError(json.error ?? 'Upload failed.'); return }
      setPhotoUrl(`${json.photoUrl}?v=${Date.now()}`)
    } catch { setPhotoError('Network error. Please try again.') }
    finally { setPhotoUploading(false) }
  }, [completedCrop])

  async function handleRemovePhoto() {
    setPhotoRemoving(true); setPhotoError('')
    try {
      const res = await fetch('/api/singles/upload-photo', { method: 'DELETE' })
      if (!res.ok) { const j = await res.json(); setPhotoError(j.error ?? 'Remove failed.'); return }
      setPhotoUrl(null)
    } catch { setPhotoError('Network error.') }
    finally { setPhotoRemoving(false) }
  }

  // ── Resume / AI parsing ───────────────────────────────────────────────────────

  function handleResumePickerClick() { setResumeError(''); resumeInputRef.current?.click() }

  async function handleResumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    e.target.value = ''
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) { setResumeError('Only PDF, JPG, PNG and WebP supported.'); return }
    if (file.size > 10 * 1024 * 1024) { setResumeError('File must be under 10 MB.'); return }

    setResumeParsing(true); setResumeError('')
    const fd = new FormData(); fd.append('resume', file)
    try {
      const res = await fetch('/api/singles/parse-resume', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) { setResumeError(json.error ?? 'Parsing failed. Please try again.'); return }

      const parsed = json.fields as Record<string, unknown>
      if (json.resumeUrl) setResumeUrl(json.resumeUrl)

      // Field mapping: Claude response key → editValues key
      const FIELD_MAP: Record<string, string> = {
        first_name: 'first_name', last_name: 'last_name', full_hebrew_name: 'full_hebrew_name',
        gender: 'gender', dob: 'dob', age: 'age', city: 'city', state: 'state',
        height_inches: 'height_inches', current_yeshiva_seminary: 'current_yeshiva_seminary',
        eretz_yisroel: 'eretz_yisroel', plans: 'plans', hashkafa: 'hashkafa',
        about_me: 'about_bio', // Claude uses about_me, DB uses about_bio
        looking_for: 'looking_for', family_background: 'family_background',
        phone: 'phone', email: 'email', occupation: 'occupation',
        current_education: 'current_education',
      }

      const newAiParsed: Record<string, AIParsedField> = {}
      const newEditValues = { ...editValues }

      // Build family_background from parsed components if field is blank
      const familyParts: string[] = []
      if (parsed.father_name || parsed.father_occupation) {
        const f = [parsed.father_name && `Father: ${parsed.father_name}`, parsed.father_occupation && `(${parsed.father_occupation})`].filter(Boolean).join(' ')
        if (f) familyParts.push(f)
      }
      if (parsed.mother_name || parsed.mother_occupation) {
        const m = [parsed.mother_name && `Mother: ${parsed.mother_name}`, parsed.mother_occupation && `(${parsed.mother_occupation})`].filter(Boolean).join(' ')
        if (m) familyParts.push(m)
      }
      const supplementalFamily = familyParts.join('\n')

      for (const [claudeKey, editKey] of Object.entries(FIELD_MAP)) {
        const rawVal = parsed[claudeKey]
        if (rawVal == null || rawVal === '') continue
        const aiValue = String(rawVal)
        const currentVal = newEditValues[editKey] ?? ''

        if (!currentVal) {
          // Field is empty — fill it
          newEditValues[editKey] = editKey === 'family_background' && supplementalFamily
            ? [aiValue, supplementalFamily].filter(Boolean).join('\n')
            : aiValue
          newAiParsed[editKey] = { aiValue: newEditValues[editKey], originalValue: '' }
        } else if (currentVal !== aiValue) {
          // Conflict: both sides have different values
          newAiParsed[editKey] = { aiValue, originalValue: currentVal }
          // Don't change editValues — user will choose
        }
        // If currentVal === aiValue: same, no action needed
      }

      // If family_background was empty and we have supplemental data
      if (!parsed.family_background && supplementalFamily && !newEditValues.family_background) {
        newEditValues.family_background = supplementalFamily
        newAiParsed.family_background = { aiValue: supplementalFamily, originalValue: '' }
      }

      setEditValues(newEditValues)
      setAiParsed(newAiParsed)
      setEditMode(true) // open edit mode so user can review

      // Store extra parsed data for display
      const raw: AIRawData = {}
      if (parsed.siblings) raw.siblings = String(parsed.siblings)
      if (parsed.references) raw.references = String(parsed.references)
      if (parsed.raw_notes) raw.raw_notes = String(parsed.raw_notes)
      if (parsed.father_name) raw.father_name = String(parsed.father_name)
      if (parsed.father_occupation) raw.father_occupation = String(parsed.father_occupation)
      if (parsed.mother_name) raw.mother_name = String(parsed.mother_name)
      if (parsed.mother_occupation) raw.mother_occupation = String(parsed.mother_occupation)
      if (parsed.previous_yeshivos) raw.previous_yeshivos = String(parsed.previous_yeshivos)
      if (Object.keys(raw).length > 0) setAiRawData(raw)
    } catch { setResumeError('Network error. Please try again.') }
    finally { setResumeParsing(false) }
  }

  function handleClearAiSuggestions() {
    const reverted = { ...editValues }
    for (const [key, info] of Object.entries(aiParsed)) reverted[key] = info.originalValue
    setEditValues(reverted)
    setAiParsed({})
    setAiRawData(null)
  }

  function resolveConflict(key: string, choice: 'ai' | 'original') {
    if (choice === 'ai') {
      setEditValues(prev => ({ ...prev, [key]: aiParsed[key].aiValue }))
      setAiParsed(prev => ({ ...prev, [key]: { ...prev[key], originalValue: '' } }))
    } else {
      setAiParsed(prev => { const n = { ...prev }; delete n[key]; return n })
    }
  }

  // ── Labels ────────────────────────────────────────────────────────────────────

  function toggleSelfLabel(label: string) {
    setSelfLabels(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label])
  }

  async function handleSaveLabels() {
    if (singleId) await fetch(`/api/singles/${singleId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ self_labels: selfLabels }) })
    setLabelsEditMode(false); setLabelSearch('')
  }

  const displayName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Your Name'
  const displayLocation = [profile.city, profile.state].filter(Boolean).join(', ')
  const filteredLabels = SYSTEM_LABEL_GROUPS.map(g => ({ ...g, labels: g.labels.filter(l => !labelSearch || l.toLowerCase().includes(labelSearch.toLowerCase())) })).filter(g => g.labels.length > 0)

  const hasConflicts = Object.values(aiParsed).some(f => f.originalValue !== '')
  const hasSuggestions = Object.keys(aiParsed).length > 0
  const aiFilled = Object.entries(aiParsed).filter(([, f]) => f.originalValue === '').map(([k]) => k)
  const conflicts = Object.entries(aiParsed).filter(([, f]) => f.originalValue !== '')

  function isAiField(key: string) { return key in aiParsed && aiParsed[key].originalValue === '' }
  function isConflict(key: string) { return key in aiParsed && aiParsed[key].originalValue !== '' }

  const fieldProps = { editMode, editValues, onChange: handleChange }

  // Build a field component that is either a ConflictRow, a normal FieldRow with AI badge, or a normal FieldRow
  function Field(props: Omit<FieldRowProps, 'aiSuggested'>) {
    const key = props.fieldKey ?? ''
    if (isConflict(key)) return null // handled separately in the conflicts section
    return <FieldRow {...props} aiSuggested={isAiField(key)} />
  }

  if (loading) {
    return (
      <AppLayout navItems={navItems} title="My Profile" role="single">
        <div className="flex items-center justify-center py-24 text-[#888888] text-sm">Loading…</div>
      </AppLayout>
    )
  }

  return (
    <AppLayout navItems={navItems} title="My Profile" role="single">

      {/* Crop modal */}
      <Dialog open={showCropModal} onOpenChange={open => { if (!open) setShowCropModal(false) }}>
        <DialogContent className="max-w-lg w-full max-h-[90vh] flex flex-col">
          <DialogHeader><DialogTitle>Crop Photo</DialogTitle></DialogHeader>
          <div className="flex-1 overflow-auto flex items-center justify-center bg-gray-50 rounded-lg min-h-0 p-2">
            {cropSrc && (
              <ReactCrop crop={crop} onChange={c => setCrop(c)} onComplete={c => setCompletedCrop(c)} aspect={1} circularCrop className="max-h-[50vh]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img ref={cropImgRef} src={cropSrc} alt="Crop preview" onLoad={onCropImageLoad} className="max-h-[50vh] max-w-full object-contain" />
              </ReactCrop>
            )}
          </div>
          <p className="text-xs text-center text-[#888888] px-4">Drag to reposition · Resize to adjust</p>
          <DialogFooter className="mt-2">
            <Button variant="secondary" onClick={() => setShowCropModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCropConfirm}><Check className="h-3.5 w-3.5 mr-1.5" />Use This Photo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" capture="user" onChange={handleFileChange} className="hidden" aria-hidden />
      <input ref={resumeInputRef} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={handleResumeChange} className="hidden" aria-hidden />

      {/* Page header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Avatar name={displayName} imageUrl={photoUrl} size="lg" />
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

      {saveError && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{saveError}</div>}

      {/* AI review banner */}
      {hasSuggestions && (
        <div className="mb-4 p-4 rounded-xl bg-yellow-50 border border-yellow-200">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-start gap-2.5">
              <Sparkles className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-yellow-800">We found information in your resume — please review before saving</p>
                <p className="text-xs text-yellow-700 mt-0.5">
                  {aiFilled.length > 0 && <span>{aiFilled.length} field{aiFilled.length !== 1 ? 's' : ''} pre-filled · </span>}
                  {hasConflicts && <span>{conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''} need your decision · </span>}
                  Fields marked <AiBadge /> were filled from your resume.
                </p>
              </div>
            </div>
            <button onClick={handleClearAiSuggestions} className="flex items-center gap-1.5 text-xs font-medium text-yellow-700 hover:underline shrink-0">
              <RotateCcw className="h-3.5 w-3.5" /> Clear all AI suggestions
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* ── Photo Upload ─────────────────────────────────────────────────── */}
        <div className="card">
          <h3 className="font-semibold text-[#1A1A1A] mb-4">Profile Photo</h3>
          <div className="flex items-center gap-6">
            <div className="relative flex-shrink-0">
              {photoUploading
                ? <div className="w-[120px] h-[120px] rounded-full bg-gray-100 flex items-center justify-center"><Loader2 className="h-8 w-8 text-brand-maroon animate-spin" /></div>
                : <Avatar name={displayName} imageUrl={photoUrl} size="2xl" />}
            </div>
            <div className="flex flex-col gap-2">
              <Button variant="outline-maroon" size="sm" onClick={handlePhotoPickerClick} disabled={photoUploading || photoRemoving} className="gap-1.5">
                <Upload className="h-3.5 w-3.5" />{photoUrl ? 'Change Photo' : 'Upload Photo'}
              </Button>
              {photoUrl && (
                <button onClick={handleRemovePhoto} disabled={photoUploading || photoRemoving} className="flex items-center gap-1.5 text-sm text-[#888888] hover:text-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  {photoRemoving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  {photoRemoving ? 'Removing…' : 'Remove Photo'}
                </button>
              )}
              <p className="text-xs text-[#AAAAAA] mt-1">JPG, PNG or WebP · Max 5 MB</p>
            </div>
          </div>
          {photoError && <p className="mt-3 text-sm text-red-600">{photoError}</p>}
        </div>

        {/* ── Resume / AI Auto-fill ────────────────────────────────────────── */}
        <div className="card">
          <h3 className="font-semibold text-[#1A1A1A] mb-1">Shidduch Resume</h3>
          <p className="text-xs text-[#888888] mb-4">Upload your shidduch resume — we&apos;ll fill in your profile automatically.</p>

          {resumeParsing ? (
            <div className="flex items-center gap-3 py-6 justify-center">
              <Loader2 className="h-5 w-5 text-brand-maroon animate-spin" />
              <p className="text-sm text-[#555555]">Reading your resume…</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <button
                onClick={handleResumePickerClick}
                className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 hover:border-brand-maroon rounded-xl p-6 text-center transition-colors group"
              >
                <FileText className="h-8 w-8 text-gray-300 group-hover:text-brand-maroon transition-colors" />
                <span className="text-sm font-medium text-[#555555] group-hover:text-brand-maroon transition-colors">
                  {resumeUrl ? 'Upload a new resume' : 'Upload resume'}
                </span>
                <span className="text-xs text-[#AAAAAA]">PDF, JPG or PNG · Max 10 MB</span>
              </button>
              {resumeUrl && (
                <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-brand-maroon hover:underline">
                  <FileText className="h-3.5 w-3.5" /> View uploaded resume
                </a>
              )}
            </div>
          )}

          {resumeError && <p className="mt-3 text-sm text-red-600">{resumeError}</p>}
        </div>

        {/* ── Conflicts (shown above regular fields when any exist) ─────────── */}
        {conflicts.length > 0 && (
          <div className="card xl:col-span-2 border-orange-200 bg-orange-50">
            <h3 className="font-semibold text-orange-800 mb-1 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-orange-200 flex items-center justify-center text-orange-700 text-xs font-bold">{conflicts.length}</span>
              Fields that need your decision
            </h3>
            <p className="text-xs text-orange-700 mb-4">Your profile and your resume have different values. Choose which to keep.</p>
            {conflicts.map(([key, info]) => {
              const textareaFields = ['about_bio', 'looking_for', 'plans', 'family_background']
              return (
                <ConflictRow
                  key={key}
                  label={key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  fieldKey={key}
                  currentValue={info.originalValue}
                  aiValue={info.aiValue}
                  inputType={textareaFields.includes(key) ? 'textarea' : 'input'}
                  onKeepCurrent={() => resolveConflict(key, 'original')}
                  onUseAi={() => resolveConflict(key, 'ai')}
                />
              )
            })}
          </div>
        )}

        {/* ── Personal Information ─────────────────────────────────────────── */}
        <div className="card">
          <h3 className="font-semibold text-[#1A1A1A] mb-2">Personal Information</h3>
          <Field label="First Name" value={editValues.first_name || profile.first_name} editable fieldKey="first_name" {...fieldProps} />
          <Field label="Last Name" value={editValues.last_name || profile.last_name} editable fieldKey="last_name" {...fieldProps} />
          <Field label="Hebrew Name" value={editValues.full_hebrew_name || profile.full_hebrew_name} editable fieldKey="full_hebrew_name" {...fieldProps} />
          <Field label="Gender" value={editValues.gender || profile.gender} editable fieldKey="gender" {...fieldProps} />
          <Field label="Date of Birth" value={editValues.dob || profile.dob} editable inputType="date" fieldKey="dob" {...fieldProps} />
          <Field label="Age" value={editValues.age || (profile.age != null ? String(profile.age) : '')} editable inputType="number" fieldKey="age" {...fieldProps} />
          <Field label="Height" value={profile.height_inches ? heightDisplay(profile.height_inches) : ''} editable inputType="number" fieldKey="height_inches" hint={`Total inches, e.g. 70 for 5'10"`} {...fieldProps} />
          <Field label="Phone" value={editValues.phone || profile.phone} editable fieldKey="phone" {...fieldProps} />
          <Field label="Email" value={editValues.email || profile.email} editable fieldKey="email" {...fieldProps} />
          <Field label="Address" value={editValues.address || profile.address} editable fieldKey="address" {...fieldProps} />
          <Field label="City" value={editValues.city || profile.city} editable fieldKey="city" {...fieldProps} />
          <Field label="State" value={editValues.state || profile.state} editable fieldKey="state" {...fieldProps} />
          <Field label="Country" value={editValues.country || profile.country} editable fieldKey="country" {...fieldProps} />
        </div>

        {/* ── Background & Education ───────────────────────────────────────── */}
        <div className="card">
          <h3 className="font-semibold text-[#1A1A1A] mb-2">Background & Education</h3>
          <Field label="Hashkafa" value={editValues.hashkafa || profile.hashkafa} editable fieldKey="hashkafa" {...fieldProps} />
          <Field label="Family Background" value={editValues.family_background || profile.family_background} editable inputType="textarea" fieldKey="family_background" {...fieldProps} />
          <Field label="High School(s)" value={editValues.high_schools || profile.high_schools} editable fieldKey="high_schools" hint="Comma-separated if multiple" {...fieldProps} />
          <Field label="Eretz Yisroel" value={editValues.eretz_yisroel || profile.eretz_yisroel} editable fieldKey="eretz_yisroel" {...fieldProps} />
          <Field label="Current Yeshiva / Seminary" value={editValues.current_yeshiva_seminary || profile.current_yeshiva_seminary} editable fieldKey="current_yeshiva_seminary" {...fieldProps} />
          <Field label="Current Education / Program" value={editValues.current_education || profile.current_education} editable fieldKey="current_education" {...fieldProps} />
          <Field label="Occupation" value={editValues.occupation || profile.occupation} editable fieldKey="occupation" {...fieldProps} />
        </div>

        {/* ── About Me ─────────────────────────────────────────────────────── */}
        <div className="card">
          <h3 className="font-semibold text-[#1A1A1A] mb-2">About Me</h3>
          <Field label="Bio" value={editValues.about_bio || profile.about_bio} editable inputType="textarea" fieldKey="about_bio" {...fieldProps} />
          <Field label="Plans" value={editValues.plans || profile.plans} editable inputType="textarea" fieldKey="plans" {...fieldProps} />
        </div>

        {/* ── Looking For ──────────────────────────────────────────────────── */}
        <div className="card">
          <h3 className="font-semibold text-[#1A1A1A] mb-2">What I Am Looking For</h3>
          <Field label="Looking For" value={editValues.looking_for || profile.looking_for} editable inputType="textarea" fieldKey="looking_for" {...fieldProps} />
        </div>

        {/* ── Additional parsed info (siblings, references, raw notes) ──────── */}
        {aiRawData && Object.values(aiRawData).some(Boolean) && (
          <div className="card xl:col-span-2 border-yellow-200 bg-yellow-50">
            <h3 className="font-semibold text-yellow-800 mb-1 flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> Other information found in your resume
            </h3>
            <p className="text-xs text-yellow-700 mb-4">These were found but don&apos;t map to specific fields — keep them in mind when completing your profile.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {aiRawData.father_name && (
                <div><p className="field-label">Father</p><p className="text-sm text-[#1A1A1A]">{aiRawData.father_name}{aiRawData.father_occupation ? ` (${aiRawData.father_occupation})` : ''}</p></div>
              )}
              {aiRawData.mother_name && (
                <div><p className="field-label">Mother</p><p className="text-sm text-[#1A1A1A]">{aiRawData.mother_name}{aiRawData.mother_occupation ? ` (${aiRawData.mother_occupation})` : ''}</p></div>
              )}
              {aiRawData.previous_yeshivos && (
                <div className="sm:col-span-2"><p className="field-label">Previous Yeshivos</p><p className="text-sm text-[#1A1A1A]">{aiRawData.previous_yeshivos}</p></div>
              )}
              {aiRawData.siblings && (
                <div className="sm:col-span-2"><p className="field-label">Siblings</p><p className="text-sm text-[#1A1A1A] whitespace-pre-wrap">{aiRawData.siblings}</p></div>
              )}
              {aiRawData.references && (
                <div className="sm:col-span-2"><p className="field-label">References</p><p className="text-sm text-[#1A1A1A] whitespace-pre-wrap">{aiRawData.references}</p></div>
              )}
              {aiRawData.raw_notes && (
                <div className="sm:col-span-2"><p className="field-label">Additional notes</p><p className="text-sm text-[#1A1A1A] whitespace-pre-wrap">{aiRawData.raw_notes}</p></div>
              )}
            </div>
          </div>
        )}

        {/* ── Labels ───────────────────────────────────────────────────────── */}
        <div className="card xl:col-span-2">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h3 className="font-semibold text-[#1A1A1A] flex items-center gap-2"><Tag className="h-4 w-4 text-brand-maroon" />My Labels</h3>
              <p className="text-xs text-[#888888] mt-0.5">Labels help Shadchanim find you when searching.</p>
            </div>
            {labelsEditMode ? (
              <div className="flex gap-2 shrink-0">
                <Button variant="secondary" size="sm" onClick={() => { setLabelsEditMode(false); setLabelSearch('') }} className="gap-1.5"><X className="h-3.5 w-3.5" /> Cancel</Button>
                <Button variant="primary" size="sm" onClick={handleSaveLabels} className="gap-1.5"><Check className="h-3.5 w-3.5" /> Save Labels</Button>
              </div>
            ) : (
              <Button variant="outline-maroon" size="sm" onClick={() => setLabelsEditMode(true)} className="gap-1.5 shrink-0"><Pencil className="h-3.5 w-3.5" /> Edit Labels</Button>
            )}
          </div>
          {!labelsEditMode && (
            <div className="flex flex-wrap gap-2">
              {selfLabels.length > 0
                ? selfLabels.map(l => <span key={l} className="text-xs bg-[#F8F0F5] text-brand-maroon px-3 py-1 rounded-full font-medium">{l}</span>)
                : <p className="text-sm text-[#888888]">No labels selected. Click &quot;Edit Labels&quot; to add some.</p>}
            </div>
          )}
          {labelsEditMode && (
            <div className="space-y-4">
              <Input placeholder="Search labels…" value={labelSearch} onChange={e => setLabelSearch(e.target.value)} className="input-base max-w-sm" />
              {filteredLabels.map(group => (
                <div key={group.category}>
                  <p className="text-xs font-semibold text-[#888888] uppercase tracking-wide mb-2">{group.category}</p>
                  <div className="flex flex-wrap gap-2">
                    {group.labels.map(label => {
                      const selected = selfLabels.includes(label)
                      return (
                        <button key={label} onClick={() => toggleSelfLabel(label)} className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-all ${selected ? 'bg-brand-maroon text-white border-brand-maroon' : 'bg-white text-[#555555] border-gray-300 hover:border-brand-maroon hover:text-brand-maroon'}`}>
                          {selected && <Check className="inline h-3 w-3 mr-1" />}{label}
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
