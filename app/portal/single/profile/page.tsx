'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useUnreadMessageCount } from '@/lib/use-unread-messages'
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import * as Tabs from '@radix-ui/react-tabs'
import {
  LayoutDashboard,
  UserCircle,
  Heart,
  MessageSquare,
  Pencil,
  X,
  Check,
  Tag,
  Trash2,
  Loader2,
  FileText,
  Sparkles,
  RotateCcw,
  Plus,
  ChevronUp,
  ChevronDown,
  Camera,
  Search,
  UserPlus,
  Lock,
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

const SYSTEM_LABEL_GROUPS = [
  { category: 'Hashkafa', labels: ['Yeshivish', 'Modern Orthodox', 'Chassidish', 'Sephardic', 'Baal Teshuva', 'Open Orthodox'] },
  { category: 'Learning & Career', labels: ['Long-term learner', 'Kollel-oriented', 'Working professional', 'STEM career', 'In chinuch', 'Medical professional'] },
  { category: 'Background', labels: ['American FFB', 'Israeli background', 'Gerim / BT family', 'Sephardic background'] },
  { category: 'Looking For', labels: ['Kollel home', 'Flexible on learning', 'Working professional match', 'Open to any background'] },
]

interface SinglePhoto { id: string; public_url: string; position: number; caption: string | null }

interface AIParsedField { aiValue: string; originalValue: string }
interface AIRawData {
  siblings?: string; references?: string; raw_notes?: string
  father_name?: string; father_occupation?: string; mother_name?: string; mother_occupation?: string; previous_yeshivos?: string
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

// Height helpers
function inchesToFt(total: number) {
  return { feet: Math.floor(total / 12), inches: total % 12 }
}
function ftToInches(feet: number, inches: number) {
  return feet * 12 + inches
}
function heightDisplay(totalStr: string): string {
  const n = parseInt(totalStr, 10)
  if (!n || n <= 0) return ''
  const { feet, inches } = inchesToFt(n)
  return `${feet}'${inches}"`
}

function AiBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 ml-1.5 select-none">
      <Sparkles className="h-2.5 w-2.5" />AI
    </span>
  )
}

function SectionSaveBar({ saving, error, onSave }: { saving: boolean; error: string; onSave: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-100 mt-4">
      {error ? <p className="text-sm text-red-600">{error}</p> : <span />}
      <Button variant="primary" size="sm" onClick={onSave} disabled={saving} className="gap-1.5 min-h-[40px]">
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
        {saving ? 'Saving…' : 'Save Section'}
      </Button>
    </div>
  )
}

function FieldRow({ label, value, editable, editMode, inputType = 'input', fieldKey = '', editValues = {}, onChange, hint, aiSuggested }: {
  label: string; value: string; editable?: boolean; editMode?: boolean
  inputType?: 'input' | 'textarea' | 'date' | 'number'; fieldKey?: string
  editValues?: Record<string, string>; onChange?: (k: string, v: string) => void
  hint?: string; aiSuggested?: boolean
}) {
  const isEditing = editable && editMode
  return (
    <div className={`flex flex-col gap-1 py-3 border-b border-gray-100 last:border-0 ${aiSuggested ? 'bg-yellow-50 -mx-3 px-3 rounded' : ''}`}>
      <span className="field-label flex items-center flex-wrap">{label}{aiSuggested && <AiBadge />}</span>
      {isEditing ? (
        inputType === 'textarea' ? (
          <Textarea value={editValues[fieldKey] ?? value} onChange={e => onChange?.(fieldKey, e.target.value)} rows={4} className="input-base text-sm" />
        ) : (
          <>
            <Input type={inputType === 'date' ? 'date' : inputType === 'number' ? 'number' : 'text'}
              value={editValues[fieldKey] ?? value} onChange={e => onChange?.(fieldKey, e.target.value)} className="input-base" />
            {hint && <p className="text-xs text-[#888888] mt-0.5">{hint}</p>}
          </>
        )
      ) : (
        <p className="text-sm text-[#1A1A1A]">{value || '—'}</p>
      )}
    </div>
  )
}

function ConflictRow({ label, currentValue, aiValue, inputType = 'input', onKeepCurrent, onUseAi }: {
  label: string; currentValue: string; aiValue: string; fieldKey: string
  inputType?: 'input' | 'textarea'; onKeepCurrent: () => void; onUseAi: () => void
}) {
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
          <p className="text-[10px] font-semibold text-yellow-700 uppercase tracking-wide mb-1.5 flex items-center gap-1"><Sparkles className="h-2.5 w-2.5" />From resume</p>
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
  const unreadMsgCount = useUnreadMessageCount()
  const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/portal/single', icon: LayoutDashboard },
    { label: 'My Profile', href: '/portal/single/profile', icon: UserCircle },
    { label: 'Suggestions', href: '/portal/single/matches', icon: Heart },
    { label: 'Messages', href: '/portal/single/messages', icon: MessageSquare, ...(unreadMsgCount > 0 ? { badge: String(unreadMsgCount) } : {}) },
  ]

  const [loading, setLoading] = useState(true)
  const [singleId, setSingleId] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState('Your Name')
  const [displayLocation, setDisplayLocation] = useState('')
  const [profileStatus, setProfileStatus] = useState<string>('available')

  // ── Photos ────────────────────────────────────────────────────────────────────
  const [photos, setPhotos] = useState<SinglePhoto[]>([])
  const [photoVisibility, setPhotoVisibility] = useState('shadchanim_only')
  const [savingPhotoVisibility, setSavingPhotoVisibility] = useState(false)
  const [cropSrc, setCropSrc] = useState('')
  const [showCropModal, setShowCropModal] = useState(false)
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoError, setPhotoError] = useState('')
  const [confirmDeletePhotoId, setConfirmDeletePhotoId] = useState<string | null>(null)
  const [deletingPhoto, setDeletingPhoto] = useState(false)
  const [confirmDeleteResume, setConfirmDeleteResume] = useState(false)
  const [deletingResume, setDeletingResume] = useState(false)
  const cropImgRef = useRef<HTMLImageElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  // ── Resume / AI ───────────────────────────────────────────────────────────────
  const [resumeParsing, setResumeParsing] = useState(false)
  const [resumeError, setResumeError] = useState('')
  const [resumeUrl, setResumeUrl] = useState<string | null>(null)
  const [aiParsed, setAiParsed] = useState<Record<string, AIParsedField>>({})
  const [aiRawData, setAiRawData] = useState<AIRawData | null>(null)
  const resumeInputRef = useRef<HTMLInputElement>(null)

  // ── Personal Info ─────────────────────────────────────────────────────────────
  const [personalValues, setPersonalValues] = useState({
    first_name: '', last_name: '', full_hebrew_name: '', gender: '',
    dob: '', age: '', height_inches: '', phone: '', email: '',
    address: '', city: '', state: '', country: '',
  })
  // Height feet/inches split state (derived from height_inches)
  const [heightFeet, setHeightFeet] = useState('')
  const [heightInchesRem, setHeightInchesRem] = useState('')
  const [savingPersonal, setSavingPersonal] = useState(false)
  const [personalError, setPersonalError] = useState('')

  // ── Education ─────────────────────────────────────────────────────────────────
  const [eduValues, setEduValues] = useState({
    high_schools: '', eretz_yisroel: '',
    current_yeshiva_seminary: '', current_education: '',
    occupation: '', elementary_school: '', education_notes: '',
  })
  const [savingEdu, setSavingEdu] = useState(false)
  const [eduError, setEduError] = useState('')

  // ── About Me ──────────────────────────────────────────────────────────────────
  const [aboutValues, setAboutValues] = useState({
    about_bio: '', plans: '', hobbies: '', hashkafa: '', languages: '',
  })
  const [savingAbout, setSavingAbout] = useState(false)
  const [aboutError, setAboutError] = useState('')
  const [selfLabels, setSelfLabels] = useState<string[]>([])
  const [labelsEditMode, setLabelsEditMode] = useState(false)
  const [labelSearch, setLabelSearch] = useState('')

  // ── Looking For ───────────────────────────────────────────────────────────────
  const [lookingForValues, setLookingForValues] = useState({
    looking_for: '', age_min: '', age_max: '', height_min: '', height_max: '',
    hashkafa_pref: '', location_pref: '', plans_pref: '', looking_for_traits: '',
    dealbreakers: '', criteria_notes: '',
  })
  const [savingLookingFor, setSavingLookingFor] = useState(false)
  const [lookingForError, setLookingForError] = useState('')

  // ── Family ────────────────────────────────────────────────────────────────────
  const [familyValues, setFamilyValues] = useState({
    family_background: '',
    fathers_name: '', father_hebrew_name: '', fathers_occupation: '',
    father_phone: '', father_email: '',
    mothers_name: '', mother_hebrew_name: '', mothers_maiden_name: '', mothers_occupation: '',
    mother_phone: '', mother_email: '',
    num_siblings: '', family_notes: '',
    family_shul_name: '', family_shul_address: '',
    family_rav_name: '', family_rav_phone: '', family_rav_shul: '',
  })
  const [savingFamily, setSavingFamily] = useState(false)
  const [familyError, setFamilyError] = useState('')

  // ── References ────────────────────────────────────────────────────────────────
  interface RefEntry { name: string; relationship: string; phone: string; email: string; notes: string }
  const [refEntries, setRefEntries] = useState<RefEntry[]>([{ name: '', relationship: '', phone: '', email: '', notes: '' }])
  const [savingRefs, setSavingRefs] = useState(false)
  const [refsError, setRefsError] = useState('')

  // ── Shadchanim Tab ────────────────────────────────────────────────────────────
  interface FamiliarShadchan { shadchan_id: string; full_name: string; city: string; phone: string | null; linked_at: string }
  const [familiarShadchanim, setFamiliarShadchanim] = useState<FamiliarShadchan[]>([])
  const [familiarLoading, setFamiliarLoading] = useState(false)
  const [shadchanSearch, setShadchanSearch] = useState('')
  const [shadchanSearchResults, setShadchanSearchResults] = useState<Array<{ id: string; full_name: string; location: string }>>([])
  const [shadchanSearchLoading, setShadchanSearchLoading] = useState(false)
  const [addingShadchan, setAddingShadchan] = useState<string | null>(null)
  const [removingShadchan, setRemovingShadchan] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setLoading(false); return }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: single } = await (supabase.from('singles') as any)
        .select('*').eq('user_id', user.id).maybeSingle()

      if (single) {
        setSingleId(single.id)
        setResumeUrl(single.resume_url ?? null)
        setProfileStatus(single.status ?? 'available')
        setPhotoVisibility(single.photo_visibility ?? 'shadchanim_only')

        const fn = single.first_name ?? ''
        const ln = single.last_name ?? ''
        setDisplayName([fn, ln].filter(Boolean).join(' ') || 'Your Name')
        setDisplayLocation([single.city, single.state].filter(Boolean).join(', '))

        const totalInches = single.height_inches != null ? Number(single.height_inches) : 0
        if (totalInches > 0) {
          const { feet, inches } = inchesToFt(totalInches)
          setHeightFeet(String(feet))
          setHeightInchesRem(String(inches))
        }

        setPersonalValues({
          first_name: fn, last_name: ln,
          full_hebrew_name: single.full_hebrew_name ?? '',
          gender: single.gender ?? '', dob: single.dob ?? '',
          age: single.age != null ? String(single.age) : '',
          height_inches: single.height_inches != null ? String(single.height_inches) : '',
          phone: single.phone ?? user.phone ?? '', email: single.email ?? user.email ?? '',
          address: single.address ?? '', city: single.city ?? '',
          state: single.state ?? '', country: single.country ?? '',
        })

        setEduValues(v => ({
          ...v,
          high_schools: hsToString(single.high_schools),
          eretz_yisroel: single.eretz_yisroel ?? '',
          current_yeshiva_seminary: single.current_yeshiva_seminary ?? '',
          current_education: single.current_education ?? '',
          occupation: single.occupation ?? '',
        }))

        setAboutValues({
          about_bio: single.about_bio ?? '',
          plans: single.plans ?? '',
          hobbies: single.hobbies ?? '',
          hashkafa: single.hashkafa ?? '',
          languages: single.languages ?? '',
        })

        setLookingForValues(v => ({ ...v, looking_for: single.looking_for ?? '' }))
        setFamilyValues(v => ({ ...v, family_background: single.family_background ?? '' }))

        if (Array.isArray(single.self_labels)) setSelfLabels(single.self_labels)

        // Fetch supplemental data
        const id = single.id
        const [photosRes, eduRes, familyRes, criteriaRes, refsRes] = await Promise.all([
          fetch(`/api/singles/${id}/photos`),
          fetch(`/api/singles/${id}/education`),
          fetch(`/api/singles/${id}/family`),
          fetch(`/api/singles/${id}/matching-criteria`),
          fetch(`/api/singles/${id}/references`),
        ])
        const [photosData, eduData, familyData, criteriaData, refsData] = await Promise.all([
          photosRes.json(), eduRes.json(), familyRes.json(), criteriaRes.json(), refsRes.json(),
        ])

        if (photosData.photos?.length) setPhotos(photosData.photos)

        if (eduData.education) {
          const ed = eduData.education
          setEduValues(v => ({
            ...v,
            elementary_school: ed.elementary_school ?? '',
            education_notes: ed.notes ?? '',
          }))
        }

        if (familyData.family) {
          const fam = familyData.family
          setFamilyValues(v => ({
            ...v,
            fathers_name: fam.fathers_name ?? '',
            father_hebrew_name: fam.father_hebrew_name ?? '',
            fathers_occupation: fam.fathers_occupation ?? '',
            father_phone: fam.father_phone ?? '',
            father_email: fam.father_email ?? '',
            mothers_name: fam.mothers_name ?? '',
            mother_hebrew_name: fam.mother_hebrew_name ?? '',
            mothers_maiden_name: fam.mothers_maiden_name ?? '',
            mothers_occupation: fam.mothers_occupation ?? '',
            mother_phone: fam.mother_phone ?? '',
            mother_email: fam.mother_email ?? '',
            num_siblings: fam.num_siblings != null ? String(fam.num_siblings) : '',
            family_notes: fam.family_notes ?? '',
            family_shul_name: fam.family_shul_name ?? '',
            family_shul_address: fam.family_shul_address ?? '',
            family_rav_name: fam.family_rav_name ?? '',
            family_rav_phone: fam.family_rav_phone ?? '',
            family_rav_shul: fam.family_rav_shul ?? '',
          }))
        }

        if (criteriaData.criteria) {
          const c = criteriaData.criteria
          setLookingForValues(v => ({
            ...v,
            age_min: c.age_min != null ? String(c.age_min) : '',
            age_max: c.age_max != null ? String(c.age_max) : '',
            height_min: c.height_min != null ? String(c.height_min) : '',
            height_max: c.height_max != null ? String(c.height_max) : '',
            hashkafa_pref: c.hashkafa_pref ?? '',
            location_pref: c.location_pref ?? '',
            plans_pref: c.plans_pref ?? '',
            looking_for_traits: c.looking_for_traits ?? '',
            dealbreakers: c.dealbreakers ?? '',
            criteria_notes: c.notes ?? '',
          }))
        }

        if (refsData.references?.length) {
          setRefEntries(refsData.references.map((r: Record<string, string>) => ({
            name: r.name ?? '', relationship: r.relationship ?? '',
            phone: r.phone ?? '', email: r.email ?? '', notes: r.notes ?? '',
          })))
        }

        // Fetch familiar shadchanim (non-blocking)
        setFamiliarLoading(true)
        fetch(`/api/singles/${id}/familiar-shadchanim`)
          .then(r => r.json())
          .then(d => { if (d.shadchanim) setFamiliarShadchanim(d.shadchanim) })
          .catch(() => { /* ignore */ })
          .finally(() => setFamiliarLoading(false))
      } else {
        const meta = (user.user_metadata ?? {}) as Record<string, string>
        setPersonalValues(v => ({
          ...v, first_name: meta.first_name ?? '', last_name: meta.last_name ?? '',
          email: user.email ?? '', phone: user.phone ?? '',
        }))
        const ensureRes = await fetch('/api/singles/ensure-profile', { method: 'POST' })
        if (ensureRes.ok) {
          const ensureJson = await ensureRes.json() as { id: string }
          setSingleId(ensureJson.id)
        }
      }
      setLoading(false)
    })
  }, [])

  // ── Completion % ─────────────────────────────────────────────────────────────
  const completionPoints = [
    photos.length > 0,
    !!personalValues.first_name && !!personalValues.last_name,
    !!personalValues.gender,
    !!(personalValues.dob || personalValues.age),
    !!personalValues.height_inches,
    !!(personalValues.phone || personalValues.email),
    !!personalValues.city,
    !!(eduValues.current_yeshiva_seminary || eduValues.current_education || eduValues.occupation),
    !!aboutValues.about_bio,
    !!aboutValues.plans,
    !!lookingForValues.looking_for,
    !!(familyValues.family_background || familyValues.fathers_name),
    refEntries.some(r => r.name.trim() !== ''),
  ]
  const completionPct = Math.round((completionPoints.filter(Boolean).length / completionPoints.length) * 100)

  // ── AI helpers ────────────────────────────────────────────────────────────────
  const hasSuggestions = Object.keys(aiParsed).length > 0
  const conflicts = Object.entries(aiParsed).filter(([, f]) => f.originalValue !== '')
  const aiFilled = Object.entries(aiParsed).filter(([, f]) => f.originalValue === '').map(([k]) => k)
  const hasConflicts = conflicts.length > 0

  function isAiField(key: string) { return key in aiParsed && aiParsed[key].originalValue === '' }
  function isConflict(key: string) { return key in aiParsed && aiParsed[key].originalValue !== '' }

  function resolveConflict(key: string, choice: 'ai' | 'original') {
    if (choice === 'ai') {
      const val = aiParsed[key].aiValue
      if (key in personalValues) setPersonalValues(prev => ({ ...prev, [key]: val }))
      else if (key === 'hashkafa' || key in aboutValues) setAboutValues(prev => ({ ...prev, [key]: val }))
      else if (key in eduValues) setEduValues(prev => ({ ...prev, [key]: val }))
      else if (key === 'family_background') setFamilyValues(prev => ({ ...prev, family_background: val }))
      setAiParsed(prev => ({ ...prev, [key]: { ...prev[key], originalValue: '' } }))
    } else {
      setAiParsed(prev => { const n = { ...prev }; delete n[key]; return n })
    }
  }

  function handleClearAiSuggestions() {
    setAiParsed({}); setAiRawData(null)
  }

  // ── Photo upload ─────────────────────────────────────────────────────────────
  function handlePhotoPickerClick() { setPhotoError(''); photoInputRef.current?.click() }

  function handlePhotoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
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
    if (!singleId) return
    const img = cropImgRef.current
    if (!img || !completedCrop || completedCrop.width === 0) { setPhotoError('Please select a crop area.'); return }
    const canvas = document.createElement('canvas')
    const OUT = 800; canvas.width = OUT; canvas.height = OUT
    const ctx = canvas.getContext('2d')!
    const sx = img.naturalWidth / img.width; const sy = img.naturalHeight / img.height
    ctx.drawImage(img, completedCrop.x * sx, completedCrop.y * sy, completedCrop.width * sx, completedCrop.height * sy, 0, 0, OUT, OUT)
    const blob: Blob | null = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.92))
    if (!blob) { setPhotoError('Failed to process image.'); return }
    setShowCropModal(false); setPhotoUploading(true); setPhotoError('')
    try {
      const fd = new FormData(); fd.append('photo', blob, 'photo.jpg')
      const res = await fetch(`/api/singles/${singleId}/photos`, { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) { setPhotoError(json.error ?? 'Upload failed.'); return }
      setPhotos(prev => [...prev, json.photo].sort((a, b) => a.position - b.position))
    } catch { setPhotoError('Network error. Please try again.') }
    finally { setPhotoUploading(false) }
  }, [completedCrop, singleId])

  async function handleDeletePhoto(photoId: string) {
    if (!singleId) return
    setDeletingPhoto(true)
    const res = await fetch(`/api/singles/${singleId}/photos/${photoId}`, { method: 'DELETE' })
    if (res.ok) setPhotos(prev => prev.filter(p => p.id !== photoId))
    setDeletingPhoto(false)
    setConfirmDeletePhotoId(null)
  }

  async function handleDeleteResume() {
    if (!singleId) return
    setDeletingResume(true)
    await fetch(`/api/singles/${singleId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume_url: null }),
    })
    setResumeUrl(null)
    setDeletingResume(false)
    setConfirmDeleteResume(false)
  }

  async function handleMovePhoto(photoId: string, direction: 'up' | 'down') {
    if (!singleId) return
    const idx = photos.findIndex(p => p.id === photoId)
    if (idx < 0) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= photos.length) return
    const newPhotos = [...photos]
    ;[newPhotos[idx], newPhotos[swapIdx]] = [newPhotos[swapIdx], newPhotos[idx]]
    const updated = newPhotos.map((p, i) => ({ ...p, position: i }))
    setPhotos(updated)
    await Promise.all([
      fetch(`/api/singles/${singleId}/photos/${newPhotos[idx].id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ position: idx }) }),
      fetch(`/api/singles/${singleId}/photos/${newPhotos[swapIdx].id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ position: swapIdx }) }),
    ])
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
      if (!res.ok) { setResumeError(json.error ?? 'Parsing failed.'); return }
      const parsed = json.fields as Record<string, unknown>
      if (json.resumeUrl) setResumeUrl(json.resumeUrl)

      // FIX 12: family info goes to family_background only — individual fields never auto-populated
      const FIELD_MAP: Record<string, string> = {
        first_name: 'first_name', last_name: 'last_name', full_hebrew_name: 'full_hebrew_name',
        gender: 'gender', dob: 'dob', age: 'age', city: 'city', state: 'state',
        height_inches: 'height_inches', current_yeshiva_seminary: 'current_yeshiva_seminary',
        eretz_yisroel: 'eretz_yisroel', plans: 'plans', hashkafa: 'hashkafa',
        about_me: 'about_bio', looking_for: 'looking_for', family_background: 'family_background',
        phone: 'phone', email: 'email', occupation: 'occupation', current_education: 'current_education',
      }

      const allValues = { ...personalValues, ...eduValues, ...aboutValues, looking_for: lookingForValues.looking_for, family_background: familyValues.family_background }
      const newAiParsed: Record<string, AIParsedField> = {}

      for (const [claudeKey, editKey] of Object.entries(FIELD_MAP)) {
        const rawVal = parsed[claudeKey]
        if (rawVal == null || rawVal === '') continue
        const aiValue = String(rawVal)
        const currentVal = (allValues as Record<string, string>)[editKey] ?? ''
        if (!currentVal) {
          newAiParsed[editKey] = { aiValue, originalValue: '' }
          if (editKey in personalValues) setPersonalValues(prev => ({ ...prev, [editKey]: aiValue }))
          else if (editKey === 'hashkafa' || editKey === 'about_bio' || editKey === 'plans') setAboutValues(prev => ({ ...prev, [editKey === 'about_bio' ? 'about_bio' : editKey]: aiValue }))
          else if (editKey in eduValues) setEduValues(prev => ({ ...prev, [editKey]: aiValue }))
          else if (editKey === 'looking_for') setLookingForValues(prev => ({ ...prev, looking_for: aiValue }))
          else if (editKey === 'family_background') setFamilyValues(prev => ({ ...prev, family_background: aiValue }))
        } else if (currentVal !== aiValue) {
          newAiParsed[editKey] = { aiValue, originalValue: currentVal }
        }
      }

      setAiParsed(newAiParsed)
      // FIX 13: raw AI data shown as info only — never auto-populates references
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
    } catch { setResumeError('Network error.') }
    finally { setResumeParsing(false) }
  }

  // ── Section saves ─────────────────────────────────────────────────────────────
  async function savePersonal() {
    if (!singleId) return
    setSavingPersonal(true); setPersonalError('')
    // Combine feet/inches back to total inches
    const totalInches = heightFeet || heightInchesRem
      ? ftToInches(parseInt(heightFeet || '0', 10), parseInt(heightInchesRem || '0', 10))
      : personalValues.height_inches ? parseInt(personalValues.height_inches, 10) : null
    const updatedHeight = totalInches && totalInches > 0 ? String(totalInches) : ''
    setPersonalValues(prev => ({ ...prev, height_inches: updatedHeight || prev.height_inches }))

    const payload: Record<string, unknown> = {
      ...personalValues,
      height_inches: totalInches && totalInches > 0 ? totalInches : null,
      age: personalValues.age ? parseInt(personalValues.age, 10) : null,
    }
    const res = await fetch(`/api/singles/${singleId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (!res.ok) { const j = await res.json(); setPersonalError(j.error ?? 'Save failed.') }
    else {
      setDisplayName([personalValues.first_name, personalValues.last_name].filter(Boolean).join(' ') || 'Your Name')
      setDisplayLocation([personalValues.city, personalValues.state].filter(Boolean).join(', '))
    }
    setSavingPersonal(false)
  }

  async function saveEducation() {
    if (!singleId) return
    setSavingEdu(true); setEduError('')
    const [r1, r2] = await Promise.all([
      fetch(`/api/singles/${singleId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          high_schools: eduValues.high_schools.trim() ? eduValues.high_schools.split(',').map(s => s.trim()).filter(Boolean) : null,
          eretz_yisroel: eduValues.eretz_yisroel || null,
          current_yeshiva_seminary: eduValues.current_yeshiva_seminary || null,
          current_education: eduValues.current_education || null,
          occupation: eduValues.occupation || null,
        }),
      }),
      fetch(`/api/singles/${singleId}/education`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          elementary_school: eduValues.elementary_school || null,
          notes: eduValues.education_notes || null,
        }),
      }),
    ])
    if (!r1.ok || !r2.ok) setEduError('Save failed. Please try again.')
    setSavingEdu(false)
  }

  async function saveAbout() {
    if (!singleId) return
    setSavingAbout(true); setAboutError('')
    const res = await fetch(`/api/singles/${singleId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        about_bio: aboutValues.about_bio || null,
        plans: aboutValues.plans || null,
        hobbies: aboutValues.hobbies || null,
        hashkafa: aboutValues.hashkafa || null,
        languages: aboutValues.languages || null,
        self_labels: selfLabels,
      }),
    })
    if (!res.ok) { const j = await res.json(); setAboutError(j.error ?? 'Save failed.') }
    setSavingAbout(false)
  }

  async function saveLookingFor() {
    if (!singleId) return
    setSavingLookingFor(true); setLookingForError('')
    const [r1, r2] = await Promise.all([
      fetch(`/api/singles/${singleId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ looking_for: lookingForValues.looking_for || null }),
      }),
      fetch(`/api/singles/${singleId}/matching-criteria`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age_min: lookingForValues.age_min ? parseInt(lookingForValues.age_min, 10) : null,
          age_max: lookingForValues.age_max ? parseInt(lookingForValues.age_max, 10) : null,
          height_min: lookingForValues.height_min ? parseInt(lookingForValues.height_min, 10) : null,
          height_max: lookingForValues.height_max ? parseInt(lookingForValues.height_max, 10) : null,
          hashkafa_pref: lookingForValues.hashkafa_pref || null,
          location_pref: lookingForValues.location_pref || null,
          plans_pref: lookingForValues.plans_pref || null,
          looking_for_traits: lookingForValues.looking_for_traits || null,
          dealbreakers: lookingForValues.dealbreakers || null,
          notes: lookingForValues.criteria_notes || null,
        }),
      }),
    ])
    if (!r1.ok || !r2.ok) setLookingForError('Save failed. Please try again.')
    setSavingLookingFor(false)
  }

  async function saveFamily() {
    if (!singleId) return
    setSavingFamily(true); setFamilyError('')
    const [r1, r2] = await Promise.all([
      fetch(`/api/singles/${singleId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ family_background: familyValues.family_background || null }),
      }),
      fetch(`/api/singles/${singleId}/family`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fathers_name: familyValues.fathers_name || null,
          father_hebrew_name: familyValues.father_hebrew_name || null,
          fathers_occupation: familyValues.fathers_occupation || null,
          father_phone: familyValues.father_phone || null,
          father_email: familyValues.father_email || null,
          mothers_name: familyValues.mothers_name || null,
          mother_hebrew_name: familyValues.mother_hebrew_name || null,
          mothers_maiden_name: familyValues.mothers_maiden_name || null,
          mothers_occupation: familyValues.mothers_occupation || null,
          mother_phone: familyValues.mother_phone || null,
          mother_email: familyValues.mother_email || null,
          num_siblings: familyValues.num_siblings ? parseInt(familyValues.num_siblings, 10) : null,
          family_notes: familyValues.family_notes || null,
          family_shul_name: familyValues.family_shul_name || null,
          family_shul_address: familyValues.family_shul_address || null,
          family_rav_name: familyValues.family_rav_name || null,
          family_rav_phone: familyValues.family_rav_phone || null,
          family_rav_shul: familyValues.family_rav_shul || null,
        }),
      }),
    ])
    if (!r1.ok || !r2.ok) setFamilyError('Save failed. Please try again.')
    setSavingFamily(false)
  }

  async function saveReferences() {
    if (!singleId) return
    setSavingRefs(true); setRefsError('')
    const cleaned = refEntries.filter(r => r.name.trim() !== '')
    const res = await fetch(`/api/singles/${singleId}/references`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ references: cleaned }),
    })
    if (!res.ok) { const j = await res.json(); setRefsError(j.error ?? 'Save failed.') }
    setSavingRefs(false)
  }

  async function savePhotoVisibility(val: string) {
    if (!singleId) return
    setSavingPhotoVisibility(true)
    await fetch(`/api/singles/${singleId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photo_visibility: val }),
    })
    setSavingPhotoVisibility(false)
  }

  // ── Shadchan search/add ───────────────────────────────────────────────────────
  useEffect(() => {
    if (shadchanSearch.trim().length < 2) { setShadchanSearchResults([]); return }
    const t = setTimeout(async () => {
      setShadchanSearchLoading(true)
      try {
        const res = await fetch(`/api/singles/search-shadchanim?q=${encodeURIComponent(shadchanSearch.trim())}`)
        const d = await res.json()
        setShadchanSearchResults(d.shadchanim ?? [])
      } catch { /* ignore */ }
      finally { setShadchanSearchLoading(false) }
    }, 300)
    return () => clearTimeout(t)
  }, [shadchanSearch])

  async function handleAddShadchan(shadchanId: string) {
    if (!singleId) return
    setAddingShadchan(shadchanId)
    const res = await fetch(`/api/singles/${singleId}/familiar-shadchanim`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shadchan_profile_id: shadchanId }),
    })
    if (res.ok) {
      const added = shadchanSearchResults.find(s => s.id === shadchanId)
      if (added && !familiarShadchanim.find(s => s.shadchan_id === shadchanId)) {
        setFamiliarShadchanim(prev => [...prev, {
          shadchan_id: shadchanId, full_name: added.full_name, city: added.location, phone: null, linked_at: new Date().toISOString(),
        }])
      }
      setShadchanSearch('')
      setShadchanSearchResults([])
    }
    setAddingShadchan(null)
  }

  async function handleRemoveShadchan(shadchanId: string) {
    if (!singleId) return
    setRemovingShadchan(shadchanId)
    await fetch(`/api/singles/${singleId}/familiar-shadchanim?shadchan_profile_id=${shadchanId}`, { method: 'DELETE' })
    setFamiliarShadchanim(prev => prev.filter(s => s.shadchan_id !== shadchanId))
    setRemovingShadchan(null)
  }

  // ── Labels ────────────────────────────────────────────────────────────────────
  function toggleSelfLabel(label: string) {
    setSelfLabels(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label])
  }
  const filteredLabels = SYSTEM_LABEL_GROUPS.map(g => ({
    ...g, labels: g.labels.filter(l => !labelSearch || l.toLowerCase().includes(labelSearch.toLowerCase()))
  })).filter(g => g.labels.length > 0)

  if (loading) {
    return (
      <AppLayout navItems={navItems} title="My Profile" role="single">
        <div className="flex items-center justify-center py-24 text-[#888888] text-sm">Loading…</div>
      </AppLayout>
    )
  }

  const firstPhoto = photos.find(p => p.position === 0) ?? photos[0] ?? null

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

      {/* Confirm delete photo */}
      <Dialog open={!!confirmDeletePhotoId} onOpenChange={open => { if (!open) setConfirmDeletePhotoId(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Photo?</DialogTitle></DialogHeader>
          <p className="text-sm text-[#555555] mt-1">This photo will be permanently deleted and cannot be recovered.</p>
          <DialogFooter className="mt-4">
            <Button variant="secondary" onClick={() => setConfirmDeletePhotoId(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => confirmDeletePhotoId && handleDeletePhoto(confirmDeletePhotoId)} disabled={deletingPhoto} className="gap-1.5">
              {deletingPhoto ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm delete resume */}
      <Dialog open={confirmDeleteResume} onOpenChange={open => { if (!open) setConfirmDeleteResume(false) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Resume?</DialogTitle></DialogHeader>
          <p className="text-sm text-[#555555] mt-1">Your uploaded resume will be removed. Your profile information will remain.</p>
          <DialogFooter className="mt-4">
            <Button variant="secondary" onClick={() => setConfirmDeleteResume(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteResume} disabled={deletingResume} className="gap-1.5">
              {deletingResume ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden file inputs */}
      <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" capture="user" onChange={handlePhotoFileChange} className="hidden" aria-hidden />
      <input ref={resumeInputRef} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={handleResumeChange} className="hidden" aria-hidden />

      {/* Page header */}
      <div className="flex items-center gap-4 mb-5">
        <Avatar name={displayName} imageUrl={firstPhoto?.public_url ?? null} size="lg" />
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-[#1A1A1A] truncate">{displayName}</h2>
          {displayLocation && <p className="text-sm text-[#555555]">{displayLocation}</p>}
          <div className="flex items-center gap-3 mt-1">
            <StatusBadge status={profileStatus} />
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-24 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-brand-maroon rounded-full transition-all" style={{ width: `${completionPct}%` }} />
              </div>
              <span className="text-xs text-[#888888]">{completionPct}% complete</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI review banner */}
      {hasSuggestions && (
        <div className="mb-5 p-4 rounded-xl bg-yellow-50 border border-yellow-200">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-start gap-2.5">
              <Sparkles className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-yellow-800">Resume info found — review before saving</p>
                <p className="text-xs text-yellow-700 mt-0.5">
                  {aiFilled.length > 0 && <span>{aiFilled.length} field{aiFilled.length !== 1 ? 's' : ''} pre-filled · </span>}
                  {hasConflicts && <span>{conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''} need your decision</span>}
                </p>
              </div>
            </div>
            <button onClick={handleClearAiSuggestions} className="flex items-center gap-1.5 text-xs font-medium text-yellow-700 hover:underline shrink-0">
              <RotateCcw className="h-3.5 w-3.5" /> Clear
            </button>
          </div>
          {hasConflicts && (
            <div className="mt-3 space-y-2">
              {conflicts.map(([key, info]) => {
                const textareaFields = ['about_bio', 'looking_for', 'plans', 'family_background']
                return (
                  <ConflictRow key={key}
                    label={key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    fieldKey={key} currentValue={info.originalValue} aiValue={info.aiValue}
                    inputType={textareaFields.includes(key) ? 'textarea' : 'input'}
                    onKeepCurrent={() => resolveConflict(key, 'original')}
                    onUseAi={() => resolveConflict(key, 'ai')}
                  />
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Tabs — FIX 3: new order */}
      <Tabs.Root defaultValue="personal" className="w-full">
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <Tabs.List className="flex border-b border-gray-200 mb-6 w-max min-w-full">
            {[
              { value: 'personal', label: 'Personal Info' },
              { value: 'about', label: 'About Me' },
              { value: 'education', label: 'Education & Career' },
              { value: 'looking', label: 'Looking For' },
              { value: 'family', label: 'Family' },
              { value: 'references', label: 'References' },
              { value: 'photos', label: 'Photos & Resume' },
              { value: 'shadchanim', label: 'Shadchanim' },
            ].map(tab => (
              <Tabs.Trigger
                key={tab.value}
                value={tab.value}
                className="px-4 py-3 text-sm font-medium border-b-2 border-transparent text-[#888888] hover:text-[#555555] transition-colors whitespace-nowrap flex-shrink-0 data-[state=active]:border-brand-maroon data-[state=active]:text-brand-maroon"
              >
                {tab.label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
        </div>

        {/* ── Personal Info ────────────────────────────────────────────────── */}
        <Tabs.Content value="personal">
          <div className="card">
            <h3 className="font-semibold text-[#1A1A1A] mb-2">Personal Information</h3>
            {(['first_name', 'last_name', 'full_hebrew_name', 'gender', 'dob', 'age'] as const).map(key => {
              const labels: Record<string, string> = {
                first_name: 'First Name', last_name: 'Last Name', full_hebrew_name: 'Hebrew Name',
                gender: 'Gender', dob: 'Date of Birth', age: 'Age',
              }
              return (
                <FieldRow key={key} label={labels[key]} value={personalValues[key]}
                  editable editMode
                  inputType={key === 'dob' ? 'date' : key === 'age' ? 'number' : 'input'}
                  fieldKey={key} editValues={personalValues}
                  onChange={(k, v) => setPersonalValues(prev => ({ ...prev, [k]: v }))}
                  aiSuggested={isAiField(key) && !isConflict(key)} />
              )
            })}

            {/* FIX 7: Height in feet/inches */}
            <div className="flex flex-col gap-1 py-3 border-b border-gray-100">
              <span className="field-label">
                Height
                {personalValues.height_inches && (
                  <span className="ml-2 text-xs font-normal text-[#888888]">= {heightDisplay(personalValues.height_inches)}</span>
                )}
              </span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Input type="number" min="4" max="7" placeholder="ft"
                    value={heightFeet}
                    onChange={e => {
                      setHeightFeet(e.target.value)
                      const total = ftToInches(parseInt(e.target.value || '0', 10), parseInt(heightInchesRem || '0', 10))
                      if (total > 0) setPersonalValues(prev => ({ ...prev, height_inches: String(total) }))
                    }}
                    className="input-base w-16 text-center" />
                  <span className="text-sm text-[#555555]">ft</span>
                </div>
                <div className="flex items-center gap-1">
                  <Input type="number" min="0" max="11" placeholder="in"
                    value={heightInchesRem}
                    onChange={e => {
                      setHeightInchesRem(e.target.value)
                      const total = ftToInches(parseInt(heightFeet || '0', 10), parseInt(e.target.value || '0', 10))
                      if (total > 0) setPersonalValues(prev => ({ ...prev, height_inches: String(total) }))
                    }}
                    className="input-base w-16 text-center" />
                  <span className="text-sm text-[#555555]">in</span>
                </div>
              </div>
            </div>

            {(['phone', 'email', 'address', 'city', 'state', 'country'] as const).map(key => {
              const labels: Record<string, string> = {
                phone: 'Phone', email: 'Email', address: 'Address', city: 'City', state: 'State', country: 'Country',
              }
              return (
                <FieldRow key={key} label={labels[key]} value={personalValues[key]}
                  editable editMode fieldKey={key} editValues={personalValues}
                  onChange={(k, v) => setPersonalValues(prev => ({ ...prev, [k]: v }))}
                  aiSuggested={isAiField(key) && !isConflict(key)} />
              )
            })}
            <SectionSaveBar saving={savingPersonal} error={personalError} onSave={savePersonal} />
          </div>
        </Tabs.Content>

        {/* ── About Me ─────────────────────────────────────────────────────── */}
        {/* FIX 8+10: Hashkafa moved here; Languages Spoken added */}
        <Tabs.Content value="about">
          <div className="card mb-5">
            <h3 className="font-semibold text-[#1A1A1A] mb-2">About Me</h3>
            <FieldRow label="Bio" value={aboutValues.about_bio} editable editMode inputType="textarea"
              fieldKey="about_bio" editValues={aboutValues}
              onChange={(k, v) => setAboutValues(prev => ({ ...prev, [k]: v }))}
              aiSuggested={isAiField('about_bio') && !isConflict('about_bio')} />
            <FieldRow label="Hashkafa" value={aboutValues.hashkafa} editable editMode
              fieldKey="hashkafa" editValues={aboutValues}
              onChange={(k, v) => setAboutValues(prev => ({ ...prev, [k]: v }))}
              aiSuggested={isAiField('hashkafa') && !isConflict('hashkafa')} />
            <FieldRow label="Plans" value={aboutValues.plans} editable editMode inputType="textarea"
              fieldKey="plans" editValues={aboutValues}
              onChange={(k, v) => setAboutValues(prev => ({ ...prev, [k]: v }))}
              aiSuggested={isAiField('plans') && !isConflict('plans')} />
            <FieldRow label="Languages Spoken" value={aboutValues.languages} editable editMode
              fieldKey="languages" editValues={aboutValues}
              onChange={(k, v) => setAboutValues(prev => ({ ...prev, [k]: v }))}
              hint="e.g. English, Hebrew, Yiddish" />
            <FieldRow label="Hobbies & Interests" value={aboutValues.hobbies} editable editMode
              fieldKey="hobbies" editValues={aboutValues}
              onChange={(k, v) => setAboutValues(prev => ({ ...prev, [k]: v }))} />
            <SectionSaveBar saving={savingAbout} error={aboutError} onSave={saveAbout} />
          </div>

          {/* Labels */}
          <div className="card">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h3 className="font-semibold text-[#1A1A1A] flex items-center gap-2"><Tag className="h-4 w-4 text-brand-maroon" />My Labels</h3>
                <p className="text-xs text-[#888888] mt-0.5">Labels help Shadchanim find you when searching.</p>
              </div>
              {labelsEditMode ? (
                <div className="flex gap-2 shrink-0">
                  <Button variant="secondary" size="sm" onClick={() => { setLabelsEditMode(false); setLabelSearch('') }} className="gap-1.5"><X className="h-3.5 w-3.5" /> Done</Button>
                </div>
              ) : (
                <Button variant="outline-maroon" size="sm" onClick={() => setLabelsEditMode(true)} className="gap-1.5 shrink-0"><Pencil className="h-3.5 w-3.5" /> Edit</Button>
              )}
            </div>
            {!labelsEditMode && (
              <div className="flex flex-wrap gap-2">
                {selfLabels.length > 0
                  ? selfLabels.map(l => <span key={l} className="text-xs bg-[#F8F0F5] text-brand-maroon px-3 py-1 rounded-full font-medium">{l}</span>)
                  : <p className="text-sm text-[#888888]">No labels selected.</p>}
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
                          <button key={label} onClick={() => toggleSelfLabel(label)}
                            className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-all ${selected ? 'bg-brand-maroon text-white border-brand-maroon' : 'bg-white text-[#555555] border-gray-300 hover:border-brand-maroon hover:text-brand-maroon'}`}>
                            {selected && <Check className="inline h-3 w-3 mr-1" />}{label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
                <div className="pt-3 border-t border-gray-100">
                  <Button variant="primary" size="sm" onClick={saveAbout} disabled={savingAbout} className="gap-1.5">
                    {savingAbout ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    Save Labels
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Tabs.Content>

        {/* ── Education & Career ───────────────────────────────────────────── */}
        {/* FIX 9: simplified fields */}
        <Tabs.Content value="education">
          <div className="card">
            <h3 className="font-semibold text-[#1A1A1A] mb-2">Education & Career</h3>
            {([
              { key: 'elementary_school', label: 'Elementary School' },
              { key: 'high_schools', label: 'High School(s)', hint: 'Comma-separated if multiple' },
              { key: 'current_yeshiva_seminary', label: 'Beis Medrash / Seminary' },
              { key: 'current_education', label: 'Current Education / Program' },
              { key: 'occupation', label: 'Occupation / Career' },
            ] as const).map(({ key, label, hint }: { key: string; label: string; hint?: string }) => (
              <FieldRow key={key} label={label} value={eduValues[key as keyof typeof eduValues]}
                editable editMode fieldKey={key} editValues={eduValues}
                onChange={(k, v) => setEduValues(prev => ({ ...prev, [k]: v }))}
                hint={hint} aiSuggested={isAiField(key) && !isConflict(key)} />
            ))}
            <FieldRow label="Notes" value={eduValues.education_notes} editable editMode inputType="textarea"
              fieldKey="education_notes" editValues={eduValues}
              onChange={(k, v) => setEduValues(prev => ({ ...prev, [k]: v }))} />
            <SectionSaveBar saving={savingEdu} error={eduError} onSave={saveEducation} />
          </div>
        </Tabs.Content>

        {/* ── Looking For ──────────────────────────────────────────────────── */}
        <Tabs.Content value="looking">
          <div className="card">
            <h3 className="font-semibold text-[#1A1A1A] mb-2">What I&apos;m Looking For</h3>
            <FieldRow label="Looking For (free text)" value={lookingForValues.looking_for} editable editMode inputType="textarea"
              fieldKey="looking_for" editValues={lookingForValues}
              onChange={(k, v) => setLookingForValues(prev => ({ ...prev, [k]: v }))}
              aiSuggested={isAiField('looking_for') && !isConflict('looking_for')} />

            <div className="mt-4 mb-2"><p className="text-xs font-semibold text-[#888888] uppercase tracking-wide">Matching Preferences</p></div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
              {([
                { key: 'age_min', label: 'Age Min', type: 'number' },
                { key: 'age_max', label: 'Age Max', type: 'number' },
                { key: 'height_min', label: 'Height Min (inches)', type: 'number' },
                { key: 'height_max', label: 'Height Max (inches)', type: 'number' },
                { key: 'hashkafa_pref', label: 'Hashkafa Preference' },
                { key: 'location_pref', label: 'Location Preference' },
                { key: 'plans_pref', label: 'Plans Preference' },
              ] as Array<{ key: string; label: string; type?: string }>).map(({ key, label, type }) => (
                <FieldRow key={key} label={label} value={lookingForValues[key as keyof typeof lookingForValues]}
                  editable editMode inputType={type === 'number' ? 'number' : 'input'}
                  fieldKey={key} editValues={lookingForValues}
                  onChange={(k, v) => setLookingForValues(prev => ({ ...prev, [k]: v }))} />
              ))}
            </div>

            <FieldRow label="Traits I&apos;m Looking For" value={lookingForValues.looking_for_traits} editable editMode inputType="textarea"
              fieldKey="looking_for_traits" editValues={lookingForValues}
              onChange={(k, v) => setLookingForValues(prev => ({ ...prev, [k]: v }))} />
            <FieldRow label="Dealbreakers" value={lookingForValues.dealbreakers} editable editMode inputType="textarea"
              fieldKey="dealbreakers" editValues={lookingForValues}
              onChange={(k, v) => setLookingForValues(prev => ({ ...prev, [k]: v }))} />
            <FieldRow label="Additional Notes" value={lookingForValues.criteria_notes} editable editMode inputType="textarea"
              fieldKey="criteria_notes" editValues={lookingForValues}
              onChange={(k, v) => setLookingForValues(prev => ({ ...prev, [k]: v }))} />

            <SectionSaveBar saving={savingLookingFor} error={lookingForError} onSave={saveLookingFor} />
          </div>
        </Tabs.Content>

        {/* ── Family ───────────────────────────────────────────────────────── */}
        {/* FIX 11: new fields; FIX 13: Family Rav section here */}
        <Tabs.Content value="family">
          <div className="card">
            <h3 className="font-semibold text-[#1A1A1A] mb-2">Family</h3>
            <FieldRow label="Family Background (general)" value={familyValues.family_background} editable editMode inputType="textarea"
              fieldKey="family_background" editValues={familyValues}
              onChange={(k, v) => setFamilyValues(prev => ({ ...prev, [k]: v }))}
              aiSuggested={isAiField('family_background') && !isConflict('family_background')} />

            <p className="text-xs font-semibold text-[#888888] uppercase tracking-wide mt-4 mb-1">Father</p>
            {([
              { key: 'fathers_name', label: "Father's Name" },
              { key: 'father_hebrew_name', label: "Father's Hebrew Name" },
              { key: 'fathers_occupation', label: "Father's Occupation" },
              { key: 'father_phone', label: "Father's Phone" },
              { key: 'father_email', label: "Father's Email" },
            ] as const).map(({ key, label }) => (
              <FieldRow key={key} label={label} value={familyValues[key as keyof typeof familyValues]}
                editable editMode fieldKey={key} editValues={familyValues}
                onChange={(k, v) => setFamilyValues(prev => ({ ...prev, [k]: v }))} />
            ))}

            <p className="text-xs font-semibold text-[#888888] uppercase tracking-wide mt-4 mb-1">Mother</p>
            {([
              { key: 'mothers_name', label: "Mother's Name" },
              { key: 'mother_hebrew_name', label: "Mother's Hebrew Name" },
              { key: 'mothers_maiden_name', label: "Mother's Maiden Name" },
              { key: 'mothers_occupation', label: "Mother's Occupation" },
              { key: 'mother_phone', label: "Mother's Phone" },
              { key: 'mother_email', label: "Mother's Email" },
            ] as const).map(({ key, label }) => (
              <FieldRow key={key} label={label} value={familyValues[key as keyof typeof familyValues]}
                editable editMode fieldKey={key} editValues={familyValues}
                onChange={(k, v) => setFamilyValues(prev => ({ ...prev, [k]: v }))} />
            ))}

            <p className="text-xs font-semibold text-[#888888] uppercase tracking-wide mt-4 mb-1">Family Shul</p>
            {([
              { key: 'family_shul_name', label: 'Shul Name' },
              { key: 'family_shul_address', label: 'Shul Address' },
            ] as const).map(({ key, label }) => (
              <FieldRow key={key} label={label} value={familyValues[key as keyof typeof familyValues]}
                editable editMode fieldKey={key} editValues={familyValues}
                onChange={(k, v) => setFamilyValues(prev => ({ ...prev, [k]: v }))} />
            ))}

            <FieldRow label="Number of Siblings" value={familyValues.num_siblings} editable editMode inputType="number"
              fieldKey="num_siblings" editValues={familyValues}
              onChange={(k, v) => setFamilyValues(prev => ({ ...prev, [k]: v }))} />
            <FieldRow label="Family Notes" value={familyValues.family_notes} editable editMode inputType="textarea"
              fieldKey="family_notes" editValues={familyValues}
              onChange={(k, v) => setFamilyValues(prev => ({ ...prev, [k]: v }))} />

            {/* FIX 13: Family Rav */}
            <p className="text-xs font-semibold text-[#888888] uppercase tracking-wide mt-4 mb-1">Family Rav</p>
            {([
              { key: 'family_rav_name', label: "Rav's Name" },
              { key: 'family_rav_phone', label: "Rav's Phone" },
              { key: 'family_rav_shul', label: 'Shul' },
            ] as const).map(({ key, label }) => (
              <FieldRow key={key} label={label} value={familyValues[key as keyof typeof familyValues]}
                editable editMode fieldKey={key} editValues={familyValues}
                onChange={(k, v) => setFamilyValues(prev => ({ ...prev, [k]: v }))} />
            ))}

            <SectionSaveBar saving={savingFamily} error={familyError} onSave={saveFamily} />
          </div>
        </Tabs.Content>

        {/* ── References ───────────────────────────────────────────────────── */}
        <Tabs.Content value="references">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-[#1A1A1A]">References</h3>
                <p className="text-xs text-[#888888] mt-0.5">Add up to 5 references for Shadchanim to contact.</p>
              </div>
              {refEntries.length < 5 && (
                <Button variant="outline-maroon" size="sm" onClick={() => setRefEntries(prev => [...prev, { name: '', relationship: '', phone: '', email: '', notes: '' }])} className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Add Reference
                </Button>
              )}
            </div>
            <div className="space-y-4">
              {refEntries.map((ref, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-gray-200 relative">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-[#555555] uppercase tracking-wide">Reference {idx + 1}</span>
                    <button onClick={() => setRefEntries(prev => prev.filter((_, i) => i !== idx))}
                      className="p-1 text-[#888888] hover:text-red-500 transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {([
                      { key: 'name', label: 'Name *', required: true },
                      { key: 'relationship', label: 'Relationship' },
                      { key: 'phone', label: 'Phone' },
                      { key: 'email', label: 'Email' },
                    ] as Array<{ key: keyof RefEntry; label: string; required?: boolean }>).map(({ key, label }) => (
                      <div key={key}>
                        <label className="field-label block mb-1">{label}</label>
                        <Input className="input-base" value={ref[key]} placeholder={label}
                          onChange={e => setRefEntries(prev => prev.map((r, i) => i === idx ? { ...r, [key]: e.target.value } : r))} />
                      </div>
                    ))}
                    <div className="sm:col-span-2">
                      <label className="field-label block mb-1">Notes</label>
                      <Textarea rows={2} className="input-base text-sm" value={ref.notes} placeholder="Optional notes"
                        onChange={e => setRefEntries(prev => prev.map((r, i) => i === idx ? { ...r, notes: e.target.value } : r))} />
                    </div>
                  </div>
                </div>
              ))}
              {refEntries.length === 0 && (
                <p className="text-sm text-[#888888] text-center py-8">No references yet. Click &quot;Add Reference&quot; to add one.</p>
              )}
            </div>
            <SectionSaveBar saving={savingRefs} error={refsError} onSave={saveReferences} />
          </div>

          {/* AI raw data — info only, never auto-populates */}
          {aiRawData && Object.values(aiRawData).some(Boolean) && (
            <div className="card mt-4 border-yellow-200 bg-yellow-50">
              <h3 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2"><Sparkles className="h-4 w-4" /> Other info found in your resume</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {aiRawData.previous_yeshivos && (
                  <div className="sm:col-span-2"><p className="field-label">Previous Yeshivos</p><p className="text-sm text-[#1A1A1A]">{aiRawData.previous_yeshivos}</p></div>
                )}
                {aiRawData.siblings && (
                  <div className="sm:col-span-2"><p className="field-label">Siblings</p><p className="text-sm text-[#1A1A1A] whitespace-pre-wrap">{aiRawData.siblings}</p></div>
                )}
                {aiRawData.references && (
                  <div className="sm:col-span-2"><p className="field-label">References (from resume — review and enter manually above)</p><p className="text-sm text-[#1A1A1A] whitespace-pre-wrap">{aiRawData.references}</p></div>
                )}
                {aiRawData.raw_notes && (
                  <div className="sm:col-span-2"><p className="field-label">Additional notes</p><p className="text-sm text-[#1A1A1A] whitespace-pre-wrap">{aiRawData.raw_notes}</p></div>
                )}
              </div>
            </div>
          )}
        </Tabs.Content>

        {/* ── Photos & Resume ──────────────────────────────────────────────── */}
        {/* FIX 4: confirm dialogs; FIX 5: photo visibility */}
        <Tabs.Content value="photos">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-[#1A1A1A]">Profile Photos</h3>
                <p className="text-xs text-[#888888] mt-0.5">Up to 5 photos · First photo is your main profile photo</p>
              </div>
              {photos.length < 5 && (
                <Button variant="outline-maroon" size="sm" onClick={handlePhotoPickerClick} disabled={photoUploading} className="gap-1.5">
                  {photoUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  Add Photo
                </Button>
              )}
            </div>

            {/* FIX 5: Photo visibility */}
            <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-gray-50 border border-gray-200">
              <Lock className="h-4 w-4 text-[#555555] flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-[#555555]">Photo Visibility</p>
                <p className="text-xs text-[#888888] mt-0.5">Control who can see your photos</p>
              </div>
              <select
                className="input-base text-sm"
                value={photoVisibility}
                disabled={savingPhotoVisibility}
                onChange={async e => {
                  const val = e.target.value
                  setPhotoVisibility(val)
                  await savePhotoVisibility(val)
                }}
              >
                <option value="shadchanim_only">Shadchanim Only</option>
                <option value="all">All Users</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>

            {photoError && <p className="mb-3 text-sm text-red-600">{photoError}</p>}

            {photos.length === 0 ? (
              <button onClick={handlePhotoPickerClick} disabled={photoUploading}
                className="w-full flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-200 hover:border-brand-maroon rounded-xl p-10 text-center transition-colors group">
                {photoUploading
                  ? <Loader2 className="h-8 w-8 text-brand-maroon animate-spin" />
                  : <Camera className="h-8 w-8 text-gray-300 group-hover:text-brand-maroon transition-colors" />}
                <span className="text-sm font-medium text-[#555555] group-hover:text-brand-maroon transition-colors">Upload your first photo</span>
                <span className="text-xs text-[#AAAAAA]">JPG, PNG or WebP · Max 5 MB</span>
              </button>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {photos.map((photo, idx) => (
                  <div key={photo.id} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.public_url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                    {idx === 0 && (
                      <div className="absolute top-1.5 start-1.5 bg-brand-maroon text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">Main</div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                      <div className="flex gap-1">
                        <button onClick={() => handleMovePhoto(photo.id, 'up')} disabled={idx === 0}
                          className="p-1.5 bg-white/20 hover:bg-white/40 rounded-lg disabled:opacity-30 transition-colors" aria-label="Move left">
                          <ChevronUp className="h-3.5 w-3.5 text-white" />
                        </button>
                        <button onClick={() => handleMovePhoto(photo.id, 'down')} disabled={idx === photos.length - 1}
                          className="p-1.5 bg-white/20 hover:bg-white/40 rounded-lg disabled:opacity-30 transition-colors" aria-label="Move right">
                          <ChevronDown className="h-3.5 w-3.5 text-white" />
                        </button>
                      </div>
                      <button onClick={() => setConfirmDeletePhotoId(photo.id)}
                        className="p-1.5 bg-red-500/80 hover:bg-red-600 rounded-lg transition-colors" aria-label="Delete">
                        <Trash2 className="h-3.5 w-3.5 text-white" />
                      </button>
                    </div>
                  </div>
                ))}
                {photos.length < 5 && (
                  <button onClick={handlePhotoPickerClick} disabled={photoUploading}
                    className="aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-brand-maroon flex flex-col items-center justify-center gap-1.5 transition-colors group">
                    {photoUploading
                      ? <Loader2 className="h-6 w-6 text-brand-maroon animate-spin" />
                      : <Plus className="h-6 w-6 text-gray-300 group-hover:text-brand-maroon transition-colors" />}
                    <span className="text-xs text-[#888888] group-hover:text-brand-maroon">Add</span>
                  </button>
                )}
              </div>
            )}

            {/* Resume upload */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h3 className="font-semibold text-[#1A1A1A] mb-1">Shidduch Resume</h3>
              <p className="text-xs text-[#888888] mb-3">Upload your shidduch resume — we&apos;ll fill in your profile automatically.</p>
              {resumeParsing ? (
                <div className="flex items-center gap-3 py-6 justify-center">
                  <Loader2 className="h-5 w-5 text-brand-maroon animate-spin" />
                  <p className="text-sm text-[#555555]">Reading your resume…</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <button onClick={handleResumePickerClick}
                    className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 hover:border-brand-maroon rounded-xl p-5 text-center transition-colors group">
                    <FileText className="h-7 w-7 text-gray-300 group-hover:text-brand-maroon transition-colors" />
                    <span className="text-sm font-medium text-[#555555] group-hover:text-brand-maroon transition-colors">
                      {resumeUrl ? 'Upload a new resume' : 'Upload resume'}
                    </span>
                    <span className="text-xs text-[#AAAAAA]">PDF, JPG or PNG · Max 10 MB</span>
                  </button>
                  {resumeUrl && (
                    <div className="flex items-center gap-3">
                      <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-brand-maroon hover:underline">
                        <FileText className="h-3.5 w-3.5" /> View uploaded resume
                      </a>
                      <button onClick={() => setConfirmDeleteResume(true)} className="flex items-center gap-1 text-xs text-red-500 hover:underline">
                        <Trash2 className="h-3 w-3" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
              {resumeError && <p className="mt-2 text-sm text-red-600">{resumeError}</p>}
            </div>
          </div>
        </Tabs.Content>

        {/* ── Shadchanim ───────────────────────────────────────────────────── */}
        {/* FIX 14: search/add shadchan + familiar list */}
        <Tabs.Content value="shadchanim">
          {/* Add a Shadchan */}
          <div className="card mb-5">
            <h3 className="font-semibold text-[#1A1A1A] mb-1 flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-brand-maroon" />
              Add a Shadchan You Know
            </h3>
            <p className="text-xs text-[#888888] mb-4">
              Search for a shadchan you are personally familiar with. They will be notified that you added them.
            </p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#888888]" />
              <Input
                placeholder="Search by name…"
                className="pl-9"
                value={shadchanSearch}
                onChange={e => setShadchanSearch(e.target.value)}
              />
            </div>

            {shadchanSearchLoading && (
              <p className="text-sm text-[#888888] py-3 text-center"><Loader2 className="inline h-4 w-4 animate-spin mr-1" />Searching…</p>
            )}

            {!shadchanSearchLoading && shadchanSearchResults.length > 0 && (
              <div className="mt-2 divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
                {shadchanSearchResults.map(sh => {
                  const alreadyAdded = familiarShadchanim.some(f => f.shadchan_id === sh.id)
                  return (
                    <div key={sh.id} className="flex items-center justify-between p-3 bg-white hover:bg-gray-50">
                      <div>
                        <p className="text-sm font-medium text-[#1A1A1A]">{sh.full_name}</p>
                        {sh.location && <p className="text-xs text-[#888888]">{sh.location}</p>}
                      </div>
                      <Button
                        size="sm"
                        variant={alreadyAdded ? 'secondary' : 'outline-maroon'}
                        disabled={alreadyAdded || addingShadchan === sh.id}
                        onClick={() => handleAddShadchan(sh.id)}
                        className="gap-1.5 shrink-0"
                      >
                        {addingShadchan === sh.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : alreadyAdded
                            ? <Check className="h-3.5 w-3.5" />
                            : <Plus className="h-3.5 w-3.5" />}
                        {alreadyAdded ? 'Added' : 'Add'}
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}

            {!shadchanSearchLoading && shadchanSearch.trim().length >= 2 && shadchanSearchResults.length === 0 && (
              <p className="text-sm text-[#888888] mt-3 text-center">No shadchanim found for &ldquo;{shadchanSearch}&rdquo;</p>
            )}
          </div>

          {/* Familiar shadchanim list */}
          <div className="card">
            <h3 className="font-semibold text-[#1A1A1A] mb-1">Shadchanim Who Know Me</h3>
            <p className="text-xs text-[#888888] mb-4">
              These shadchanim have been added to your profile as people who know you personally.
            </p>
            {familiarLoading ? (
              <p className="text-sm text-[#888888] py-4 text-center">Loading…</p>
            ) : familiarShadchanim.length === 0 ? (
              <p className="text-sm text-[#888888] py-4 text-center">
                No shadchanim added yet. Search above to add one.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {familiarShadchanim.map((sh) => (
                  <div key={sh.shadchan_id} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 bg-[#FAFAFA]">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1A1A1A]">{sh.full_name}</p>
                      <p className="text-xs text-[#888888] mt-0.5">{sh.city}</p>
                      {sh.phone && <p className="text-xs text-[#555555] mt-0.5">{sh.phone}</p>}
                    </div>
                    <button
                      onClick={() => handleRemoveShadchan(sh.shadchan_id)}
                      disabled={removingShadchan === sh.shadchan_id}
                      className="p-1.5 text-[#888888] hover:text-red-500 transition-colors flex-shrink-0"
                      aria-label="Remove"
                    >
                      {removingShadchan === sh.shadchan_id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <X className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Tabs.Content>
      </Tabs.Root>

      {/* Mobile sticky save reminder */}
      <div className="sm:hidden fixed bottom-16 inset-x-0 z-10 bg-white border-t border-gray-100 px-4 py-2">
        <p className="text-xs text-center text-[#888888]">Scroll down in each tab to save that section</p>
      </div>
    </AppLayout>
  )
}
