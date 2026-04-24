'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Users,
  Heart,
  CalendarCheck,
  MessageSquare,
  UsersRound,
  UserCircle,
  ChevronLeft,
  Plus,
  X,
  Tag,
  Lock,
  FileDown,
  Trash2,
  Pencil,
  Check,
  Loader2,
  ExternalLink,
  Upload,
  Globe,
  AlertTriangle,
  Bold,
  Italic,
  List,
  Paperclip,
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { Avatar } from '@/components/ui/avatar'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import type { NavItem } from '@/components/ui/sidebar'
import { heightToDisplay } from '@/lib/utils'
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

interface SingleDetail {
  id: string
  first_name: string
  last_name: string
  full_hebrew_name: string | null
  gender: 'male' | 'female'
  dob: string | null
  age: number | null
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  state: string | null
  country: string | null
  postal_code: string | null
  height_inches: number | null
  about_bio: string | null
  current_education: string | null
  occupation: string | null
  high_schools: string | null
  eretz_yisroel: string | null
  current_yeshiva_seminary: string | null
  family_background: string | null
  siblings: string | null
  looking_for: string | null
  plans: string | null
  hashkafa: string | null
  photo_url: string | null
  status: string
  hair_color?: string | null
  eye_color?: string | null
  body_type?: string | null
  complexion?: string | null
  minyan_attendance?: string | null
  shabbos_observance?: string | null
  smoking?: string | null
  dietary_restrictions?: string | null
  hobbies?: string | null
  personality_traits?: string | null
}

interface EducationDetail {
  elementary_school?: string | null
  post_high_school?: string | null
  bachelors_degree?: string | null
  grad_degree?: string | null
  certifications?: string | null
  currently_in_school?: boolean
  notes?: string | null
}

interface FamilyDetail {
  fathers_name?: string | null
  fathers_occupation?: string | null
  mothers_name?: string | null
  mothers_maiden_name?: string | null
  mothers_occupation?: string | null
  num_siblings?: number | null
  family_notes?: string | null
}

interface RefDetail {
  id: string
  name: string
  relationship?: string | null
  phone?: string | null
  email?: string | null
  notes?: string | null
}

interface DatingHistoryEntry {
  id: string
  person_name: string
  date_approximate: string | null
  outcome: string | null
  notes: string | null
  created_at: string
}

interface MatchRow {
  id: string
  boy_id: string
  girl_id: string
  status: string
  created_at: string
  otherName: string
  otherCity: string
}

interface TaskRow {
  id: string
  title: string
  type: string
  due_date: string
  status: string
}

interface LabelRow {
  id: string
  name: string
}

interface PublicNote {
  id: string
  note_text: string
  shadchan_id: string
  shadchan_name: string
  created_at: string
  is_own: boolean
}

const taskTypeClasses: Record<string, string> = {
  follow_up: 'bg-blue-50 text-blue-700',
  date_scheduled: 'bg-green-50 text-green-700',
  on_hold: 'bg-yellow-50 text-yellow-700',
  note: 'bg-purple-50 text-purple-700',
  other: 'bg-gray-100 text-gray-600',
}

const taskTypeLabels: Record<string, string> = {
  follow_up: 'Follow Up',
  date_scheduled: 'Date',
  on_hold: 'On Hold',
  note: 'Note',
  other: 'Other',
}

const hashkafaLabels: Record<string, string> = {
  yeshivish: 'Yeshivish',
  modern_orthodox: 'Modern Orthodox',
  chassidish: 'Chassidish',
  sephardic: 'Sephardic',
  baal_teshuva: 'Baal Teshuva',
  other: 'Other',
}

type Tab = 'profile' | 'matches' | 'tasks' | 'notes' | 'history'

function FieldRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex gap-3 py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs text-[#888888] w-28 sm:w-40 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-[#1A1A1A]">{value || '—'}</span>
    </div>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-maroon mb-2 mt-4 first:mt-0">
      {children}
    </h3>
  )
}

export default function SingleProfilePage() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [loading, setLoading] = useState(true)
  const [single, setSingle] = useState<SingleDetail | null>(null)
  const [profileId, setProfileId] = useState('')
  const [matches, setMatches] = useState<MatchRow[]>([])
  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [labelLibrary, setLabelLibrary] = useState<LabelRow[]>([])
  const [assignedIds, setAssignedIds] = useState<string[]>([])
  const [labelsOpen, setLabelsOpen] = useState(false)
  const [newLabelName, setNewLabelName] = useState('')
  // Supplemental data
  const [education, setEducation] = useState<EducationDetail | null>(null)
  const [family, setFamily] = useState<FamilyDetail | null>(null)
  const [references, setReferences] = useState<RefDetail[]>([])
  const [singlePhotos, setSinglePhotos] = useState<Array<{ id: string; public_url: string }>>([])
  // Familiar shadchanim
  const [familiarShadchanim, setFamiliarShadchanim] = useState<Array<{ full_name: string; city: string; phone: string | null }>>([])
  // Dating history
  const [datingHistory, setDatingHistory] = useState<DatingHistoryEntry[]>([])
  const [historyFormOpen, setHistoryFormOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<DatingHistoryEntry | null>(null)
  const [historyForm, setHistoryForm] = useState({ person_name: '', date_approximate: '', outcome: '', notes: '' })
  const [savingHistory, setSavingHistory] = useState(false)
  // PDF
  const [pdfGenerating, setPdfGenerating] = useState(false)

  // ── Private notes ───────────────────────────────────────────────────────────
  const [privateNotes, setPrivateNotes] = useState('')
  const [privateNotesDirty, setPrivateNotesDirty] = useState(false)
  const [privateNotesSaving, setPrivateNotesSaving] = useState(false)
  const [privateNotesSaved, setPrivateNotesSaved] = useState(false)
  const [privateNoteImageSignedUrl, setPrivateNoteImageSignedUrl] = useState<string | null>(null)
  const [uploadingNoteImage, setUploadingNoteImage] = useState(false)
  const privateNotesTextareaRef = useRef<HTMLTextAreaElement>(null)
  const noteImageInputRef = useRef<HTMLInputElement>(null)

  // ── Private photo ────────────────────────────────────────────────────────────
  const [privatePhotoSignedUrl, setPrivatePhotoSignedUrl] = useState<string | null>(null)
  const [privatePhotoLoading, setPrivatePhotoLoading] = useState(true)
  const [uploadingPrivatePhoto, setUploadingPrivatePhoto] = useState(false)
  const privatePhotoInputRef = useRef<HTMLInputElement>(null)

  // ── Public notes ─────────────────────────────────────────────────────────────
  const [publicNotes, setPublicNotes] = useState<PublicNote[]>([])
  const [publicNotesLoading, setPublicNotesLoading] = useState(false)
  const [publicNotesLoaded, setPublicNotesLoaded] = useState(false)
  const [newPublicNote, setNewPublicNote] = useState('')
  const [postingPublicNote, setPostingPublicNote] = useState(false)
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null)

  // ── Initial load ─────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (supabase.from('shadchan_profiles') as any)
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle() as { data: { id: string } | null }

      if (!profile) { setLoading(false); return }
      setProfileId(profile.id)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: s } = await (supabase.from('singles') as any)
        .select('id, first_name, last_name, full_hebrew_name, gender, dob, age, phone, email, address, city, state, country, postal_code, height_inches, about_bio, current_education, occupation, high_schools, eretz_yisroel, current_yeshiva_seminary, family_background, siblings, looking_for, plans, hashkafa, photo_url, status')
        .eq('id', id)
        .maybeSingle() as { data: SingleDetail | null }

      if (!s) { setLoading(false); return }
      setSingle(s)

      // Parallel supplemental fetches
      const [eduRes, famRes, refsRes, photosRes, historyRes, famShadRes, privatePhotoRes] = await Promise.all([
        fetch(`/api/singles/${id}/education`),
        fetch(`/api/singles/${id}/family`),
        fetch(`/api/singles/${id}/references`),
        fetch(`/api/singles/${id}/photos`),
        fetch(`/api/singles/${id}/dating-history`),
        fetch(`/api/singles/${id}/familiar-shadchanim`),
        fetch(`/api/singles/${id}/private-photo`),
      ])
      const [eduData, famData, refsData, photosData, historyData, famShadData, privatePhotoData] = await Promise.all([
        eduRes.json(), famRes.json(), refsRes.json(), photosRes.json(),
        historyRes.json(), famShadRes.json(), privatePhotoRes.json(),
      ])
      if (eduData.education) setEducation(eduData.education)
      if (famData.family) setFamily(famData.family)
      if (refsData.references?.length) setReferences(refsData.references)
      if (photosData.photos?.length) setSinglePhotos(photosData.photos)
      if (historyData.history?.length) setDatingHistory(historyData.history)
      if (famShadData.shadchanim?.length) setFamiliarShadchanim(famShadData.shadchanim)
      setPrivatePhotoSignedUrl(privatePhotoData.photoUrl ?? null)
      setPrivateNoteImageSignedUrl(privatePhotoData.noteImageUrl ?? null)
      setPrivatePhotoLoading(false)

      // Load matches
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: matchRows } = await (supabase.from('matches') as any)
        .select('id, boy_id, girl_id, status, created_at')
        .or(`boy_id.eq.${id},girl_id.eq.${id}`)
        .order('created_at', { ascending: false }) as {
          data: Array<{ id: string; boy_id: string; girl_id: string; status: string; created_at: string }> | null
        }

      if (matchRows && matchRows.length > 0) {
        const otherIds = matchRows.map((m) => m.boy_id === id ? m.girl_id : m.boy_id)
        const uniqueOtherIds = Array.from(new Set(otherIds))
        const otherMap: Record<string, { name: string; city: string }> = {}
        for (const oid of uniqueOtherIds) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: other } = await (supabase.from('singles') as any)
            .select('first_name, last_name, city, state')
            .eq('id', oid)
            .maybeSingle() as { data: { first_name: string; last_name: string; city: string | null; state: string | null } | null }
          if (other) {
            otherMap[oid] = {
              name: `${other.first_name} ${other.last_name}`.trim(),
              city: [other.city, other.state].filter(Boolean).join(', '),
            }
          }
        }
        setMatches(matchRows.map((m) => {
          const otherId = m.boy_id === id ? m.girl_id : m.boy_id
          return { ...m, otherName: otherMap[otherId]?.name ?? '—', otherCity: otherMap[otherId]?.city ?? '—' }
        }))
      }

      // Load tasks
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: taskRows } = await (supabase.from('calendar_tasks') as any)
        .select('id, title, type, due_date, status')
        .eq('single_id', id)
        .eq('shadchan_id', profile.id)
        .neq('type', 'note')
        .order('due_date', { ascending: true }) as { data: TaskRow[] | null }
      setTasks(taskRows ?? [])

      // Load label library
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: labelsData } = await (supabase.from('labels') as any)
        .select('id, name')
        .eq('shadchan_id', profile.id)
        .order('name', { ascending: true }) as { data: LabelRow[] | null }
      setLabelLibrary(labelsData ?? [])

      // Load assigned labels
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: slData } = await (supabase.from('single_labels') as any)
        .select('label_id')
        .eq('single_id', id) as { data: Array<{ label_id: string }> | null }
      setAssignedIds((slData ?? []).map((sl) => sl.label_id))

      // Load private notes from dedicated table
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: privateNoteRow } = await (supabase.from('shadchan_private_notes') as any)
        .select('note_text')
        .eq('single_id', id)
        .eq('shadchan_id', profile.id)
        .maybeSingle() as { data: { note_text: string } | null }
      if (privateNoteRow?.note_text) setPrivateNotes(privateNoteRow.note_text)

      setLoading(false)
    }
    load()
  }, [id])

  // ── Auto-save private notes (debounced 1 s) ──────────────────────────────────
  useEffect(() => {
    if (!profileId || !id || !privateNotesDirty) return
    const tid = setTimeout(async () => {
      setPrivateNotesSaving(true)
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('shadchan_private_notes') as any).upsert(
        {
          shadchan_id: profileId,
          single_id: id,
          note_text: privateNotes,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'shadchan_id,single_id' }
      )
      setPrivateNotesSaving(false)
      setPrivateNotesDirty(false)
      setPrivateNotesSaved(true)
      setTimeout(() => setPrivateNotesSaved(false), 2000)
    }, 1000)
    return () => clearTimeout(tid)
  }, [privateNotes, privateNotesDirty, profileId, id])

  // ── Lazy-load public notes when Notes tab first opened ───────────────────────
  useEffect(() => {
    if (activeTab !== 'notes' || publicNotesLoaded) return
    async function loadPublicNotes() {
      setPublicNotesLoading(true)
      try {
        const res = await fetch(`/api/singles/${id}/public-notes`)
        if (res.ok) {
          const data = await res.json()
          setPublicNotes(data.notes ?? [])
        }
      } catch { /* ignore */ }
      setPublicNotesLoading(false)
      setPublicNotesLoaded(true)
    }
    loadPublicNotes()
  }, [activeTab, publicNotesLoaded, id])

  // ── Label handlers ────────────────────────────────────────────────────────────
  async function toggleLabel(labelId: string) {
    const supabase = createClient()
    if (assignedIds.includes(labelId)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('single_labels') as any).delete().eq('single_id', id).eq('label_id', labelId)
      setAssignedIds((prev) => prev.filter((x) => x !== labelId))
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('single_labels') as any).insert({ single_id: id, label_id: labelId })
      setAssignedIds((prev) => [...prev, labelId])
    }
  }

  async function handleCreateLabel() {
    const name = newLabelName.trim()
    if (!name || !profileId) return
    const supabase = createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newLabel } = await (supabase.from('labels') as any)
      .insert({ shadchan_id: profileId, name })
      .select()
      .single() as { data: LabelRow | null }
    if (newLabel) {
      setLabelLibrary((prev) => [...prev, newLabel])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('single_labels') as any).insert({ single_id: id, label_id: newLabel.id })
      setAssignedIds((prev) => [...prev, newLabel.id])
    }
    setNewLabelName('')
  }

  // ── PDF ───────────────────────────────────────────────────────────────────────
  async function handlePdfDownload() {
    if (!single) return
    setPdfGenerating(true)
    try {
      const [{ pdf }, { SinglePdfDocument }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('@/components/singles/single-pdf-document'),
      ])
      const { createElement } = await import('react')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blob = await (pdf as any)(createElement(SinglePdfDocument, {
        single, education: education ?? undefined, family: family ?? undefined, references,
      })).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${single.first_name}_${single.last_name}_profile.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) { console.error('[pdf]', err) }
    finally { setPdfGenerating(false) }
  }

  // ── Dating history handlers ───────────────────────────────────────────────────
  function openNewHistory() {
    setEditingEntry(null)
    setHistoryForm({ person_name: '', date_approximate: '', outcome: '', notes: '' })
    setHistoryFormOpen(true)
  }

  function openEditHistory(entry: DatingHistoryEntry) {
    setEditingEntry(entry)
    setHistoryForm({
      person_name: entry.person_name,
      date_approximate: entry.date_approximate ?? '',
      outcome: entry.outcome ?? '',
      notes: entry.notes ?? '',
    })
    setHistoryFormOpen(true)
  }

  async function handleSaveHistory() {
    if (!historyForm.person_name.trim()) return
    setSavingHistory(true)
    if (editingEntry) {
      const res = await fetch(`/api/singles/${id}/dating-history/${editingEntry.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(historyForm),
      })
      if (res.ok) setDatingHistory(prev => prev.map(e => e.id === editingEntry.id ? { ...e, ...historyForm } : e))
    } else {
      const res = await fetch(`/api/singles/${id}/dating-history`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(historyForm),
      })
      if (res.ok) {
        const j = await res.json()
        setDatingHistory(prev => [j.entry, ...prev])
      }
    }
    setSavingHistory(false)
    setHistoryFormOpen(false)
  }

  async function handleDeleteHistory(entryId: string) {
    const res = await fetch(`/api/singles/${id}/dating-history/${entryId}`, { method: 'DELETE' })
    if (res.ok) setDatingHistory(prev => prev.filter(e => e.id !== entryId))
  }

  // ── Private notes formatting toolbar ─────────────────────────────────────────
  function applyFormat(type: 'bold' | 'italic' | 'bullet') {
    const ta = privateNotesTextareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd

    if (type === 'bold') {
      const newText = privateNotes.slice(0, start) + `**${privateNotes.slice(start, end)}**` + privateNotes.slice(end)
      setPrivateNotes(newText)
      setPrivateNotesDirty(true)
      setTimeout(() => { ta.selectionStart = start + 2; ta.selectionEnd = end + 2; ta.focus() }, 0)
    } else if (type === 'italic') {
      const newText = privateNotes.slice(0, start) + `*${privateNotes.slice(start, end)}*` + privateNotes.slice(end)
      setPrivateNotes(newText)
      setPrivateNotesDirty(true)
      setTimeout(() => { ta.selectionStart = start + 1; ta.selectionEnd = end + 1; ta.focus() }, 0)
    } else {
      const lineStart = privateNotes.lastIndexOf('\n', start - 1) + 1
      const newText = privateNotes.slice(0, lineStart) + '• ' + privateNotes.slice(lineStart)
      setPrivateNotes(newText)
      setPrivateNotesDirty(true)
      setTimeout(() => { ta.selectionStart = start + 2; ta.selectionEnd = end + 2; ta.focus() }, 0)
    }
  }

  // ── Private photo upload ──────────────────────────────────────────────────────
  async function handlePrivatePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPrivatePhoto(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'photo')
    try {
      const res = await fetch(`/api/singles/${id}/private-photo`, { method: 'POST', body: formData })
      if (res.ok) {
        const json = await res.json()
        setPrivatePhotoSignedUrl(json.signedUrl)
      }
    } catch { /* ignore */ }
    setUploadingPrivatePhoto(false)
    if (privatePhotoInputRef.current) privatePhotoInputRef.current.value = ''
  }

  // ── Note image upload ─────────────────────────────────────────────────────────
  async function handleNoteImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingNoteImage(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'note')
    try {
      const res = await fetch(`/api/singles/${id}/private-photo`, { method: 'POST', body: formData })
      if (res.ok) {
        const json = await res.json()
        setPrivateNoteImageSignedUrl(json.signedUrl)
      }
    } catch { /* ignore */ }
    setUploadingNoteImage(false)
    if (noteImageInputRef.current) noteImageInputRef.current.value = ''
  }

  // ── Public notes handlers ─────────────────────────────────────────────────────
  async function handleAddPublicNote() {
    const text = newPublicNote.trim()
    if (!text || postingPublicNote) return
    setPostingPublicNote(true)
    try {
      const res = await fetch(`/api/singles/${id}/public-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note_text: text }),
      })
      if (res.ok) {
        const json = await res.json()
        setPublicNotes(prev => [json.note, ...prev])
        setNewPublicNote('')
      }
    } catch { /* ignore */ }
    setPostingPublicNote(false)
  }

  async function handleDeletePublicNote(noteId: string) {
    setDeletingNoteId(noteId)
    try {
      const res = await fetch(`/api/singles/${id}/public-notes/${noteId}`, { method: 'DELETE' })
      if (res.ok) setPublicNotes(prev => prev.filter(n => n.id !== noteId))
    } catch { /* ignore */ }
    setDeletingNoteId(null)
  }

  const assignedLabels = labelLibrary.filter((l) => assignedIds.includes(l.id))

  const tabs: { key: Tab; label: string }[] = [
    { key: 'profile', label: 'Profile' },
    { key: 'matches', label: `Matches (${matches.length})` },
    { key: 'tasks', label: `Tasks (${tasks.length})` },
    { key: 'history', label: `Dating History (${datingHistory.length})` },
    { key: 'notes', label: 'Notes' },
  ]

  if (loading) {
    return (
      <AppLayout navItems={navItems} title="Single Profile" role="shadchan">
        <div className="flex items-center justify-center py-24 text-[#888888] text-sm">Loading…</div>
      </AppLayout>
    )
  }

  if (!single) {
    return (
      <AppLayout navItems={navItems} title="Single Not Found" role="shadchan">
        <div className="card flex flex-col items-center justify-center py-16 text-center gap-4">
          <p className="text-[#555555]">Single not found or access denied.</p>
          <Link href="/dashboard/singles"><Button variant="secondary">Back to My Singles</Button></Link>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout navItems={navItems} title="Single Profile" role="shadchan">
      <div className="mb-4">
        <Link href="/dashboard/singles" className="inline-flex items-center gap-1.5 text-sm text-[#555555] hover:text-brand-maroon transition-colors">
          <ChevronLeft className="h-4 w-4" />
          Back to My Singles
        </Link>
      </div>

      {/* Header card */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          <Avatar name={`${single.first_name} ${single.last_name}`} imageUrl={single.photo_url} size="xl" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-[#1A1A1A]">{single.first_name} {single.last_name}</h1>
                {single.full_hebrew_name && (
                  <p className="text-base text-[#888888] mt-0.5 font-medium" dir="rtl">{single.full_hebrew_name}</p>
                )}
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  {single.age && <span className="text-sm text-[#555555]">Age {single.age}</span>}
                  {single.age && (single.city || single.state) && <span className="text-[#DDDDDD]">•</span>}
                  {(single.city || single.state) && (
                    <span className="text-sm text-[#555555]">{[single.city, single.state].filter(Boolean).join(', ')}</span>
                  )}
                  <span className="text-[#DDDDDD]">•</span>
                  <StatusBadge status={single.status} />
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 flex-wrap">
                <Link href="/dashboard/matches">
                  <Button variant="pink" size="sm" className="gap-2">
                    <Heart className="h-3.5 w-3.5" />Create Match
                  </Button>
                </Link>
                <Link href="/dashboard/tasks">
                  <Button variant="outline-maroon" size="sm" className="gap-2">
                    <Plus className="h-3.5 w-3.5" />Add Task
                  </Button>
                </Link>
                <Button variant="secondary" size="sm" className="gap-2" onClick={() => setLabelsOpen(true)}>
                  <Tag className="h-3.5 w-3.5" />Manage Labels
                </Button>
                <Button variant="secondary" size="sm" className="gap-2" onClick={handlePdfDownload} disabled={pdfGenerating}>
                  {pdfGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
                  Download PDF
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card p-0 overflow-hidden">
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors flex-shrink-0 ${
                activeTab === tab.key
                  ? 'border-brand-pink text-brand-pink'
                  : 'border-transparent text-[#888888] hover:text-[#555555]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">

          {/* ── PROFILE TAB ── */}
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Main profile photo — full size, uncropped */}
              {(single.photo_url || singlePhotos.length > 0) && (
                <div className="lg:col-span-2">
                  <SectionHeading>Photos</SectionHeading>
                  <div className="flex flex-col sm:flex-row gap-5 items-start">
                    {single.photo_url && (
                      <div className="flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={single.photo_url}
                          alt={`${single.first_name} ${single.last_name}`}
                          className="w-72 rounded-xl object-contain bg-gray-50 border border-gray-200"
                          style={{ maxHeight: '360px' }}
                        />
                        <a
                          href={single.photo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-xs text-brand-maroon hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View Full Size
                        </a>
                      </div>
                    )}
                    {singlePhotos.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {singlePhotos.map((p, i) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={p.id} src={p.public_url} alt={`Photo ${i + 1}`}
                            className={`h-20 w-20 rounded-lg object-cover border-2 ${i === 0 && !single.photo_url ? 'border-brand-maroon' : 'border-gray-200'}`} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Private photo section */}
              <div className="lg:col-span-2">
                <SectionHeading>My Private Photo</SectionHeading>
                <p className="text-xs text-[#888888] mb-3 flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Only visible to you — never shared with anyone else.
                </p>
                {privatePhotoLoading ? (
                  <div className="flex items-center gap-2 text-xs text-[#888888]">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
                  </div>
                ) : privatePhotoSignedUrl ? (
                  <div className="flex items-start gap-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={privatePhotoSignedUrl}
                      alt="My private photo"
                      className="w-48 rounded-xl object-contain bg-gray-50 border border-gray-200"
                      style={{ maxHeight: '240px' }}
                    />
                    <div>
                      <input ref={privatePhotoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePrivatePhotoUpload} />
                      <Button
                        variant="secondary"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => privatePhotoInputRef.current?.click()}
                        disabled={uploadingPrivatePhoto}
                      >
                        {uploadingPrivatePhoto ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                        Replace Photo
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <input ref={privatePhotoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePrivatePhotoUpload} />
                    <button
                      onClick={() => privatePhotoInputRef.current?.click()}
                      disabled={uploadingPrivatePhoto}
                      className="flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-dashed border-gray-200 hover:border-brand-maroon/40 hover:bg-[#FBF5F9] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-default"
                    >
                      {uploadingPrivatePhoto
                        ? <Loader2 className="h-6 w-6 animate-spin text-[#888888]" />
                        : <Upload className="h-6 w-6 text-[#888888]" />
                      }
                      <p className="text-sm text-[#555555]">{uploadingPrivatePhoto ? 'Uploading…' : 'Upload My Private Photo'}</p>
                      <p className="text-xs text-[#888888]">JPG, PNG or WebP · max 5 MB</p>
                    </button>
                  </div>
                )}
              </div>

              {/* Left column */}
              <div>
                <SectionHeading>Personal Info</SectionHeading>
                <FieldRow label="Date of Birth" value={single.dob} />
                <FieldRow label="Gender" value={single.gender === 'male' ? 'Male' : 'Female'} />
                <FieldRow label="Height" value={single.height_inches ? heightToDisplay(single.height_inches) : null} />
                <FieldRow label="Hashkafa" value={single.hashkafa ? hashkafaLabels[single.hashkafa] ?? single.hashkafa : null} />

                <SectionHeading>Contact</SectionHeading>
                <FieldRow label="Phone" value={single.phone} />
                <FieldRow label="Email" value={single.email} />
                <FieldRow label="Address" value={single.address} />
                <FieldRow label="City / State" value={[single.city, single.state, single.postal_code].filter(Boolean).join(' ')} />
                <FieldRow label="Country" value={single.country} />

                <SectionHeading>Appearance</SectionHeading>
                <FieldRow label="Hair Color" value={single.hair_color} />
                <FieldRow label="Eye Color" value={single.eye_color} />
                <FieldRow label="Build" value={single.body_type} />
                <FieldRow label="Complexion" value={single.complexion} />

                <SectionHeading>Lifestyle</SectionHeading>
                <FieldRow label="Minyan Attendance" value={single.minyan_attendance} />
                <FieldRow label="Shabbos Observance" value={single.shabbos_observance} />
                <FieldRow label="Smoking" value={single.smoking} />
                <FieldRow label="Dietary" value={single.dietary_restrictions} />
                <FieldRow label="Hobbies" value={single.hobbies} />
                <FieldRow label="Personality" value={single.personality_traits} />

                <SectionHeading>Your Labels</SectionHeading>
                <div className="flex flex-wrap gap-1.5 py-2">
                  {assignedLabels.length > 0 ? (
                    assignedLabels.map((label) => (
                      <span key={label.id} className="inline-flex items-center gap-1 text-xs bg-[#F8F0F5] text-brand-maroon px-2.5 py-1 rounded-full font-medium">
                        {label.name}
                        <button onClick={() => toggleLabel(label.id)} className="hover:text-brand-maroon/60 transition-colors ml-0.5">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-[#888888] py-1">No labels assigned. Click Manage Labels to add.</p>
                  )}
                </div>
                <p className="text-xs text-[#888888] mt-1 flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Labels are private — only you can see them.
                </p>
              </div>

              {/* Right column */}
              <div>
                <SectionHeading>Education</SectionHeading>
                <FieldRow label="Elementary School" value={education?.elementary_school} />
                <FieldRow label="High Schools" value={typeof single.high_schools === 'string' ? single.high_schools : null} />
                <FieldRow label="Eretz Yisroel" value={single.eretz_yisroel} />
                <FieldRow label="Yeshiva / Seminary" value={single.current_yeshiva_seminary} />
                <FieldRow label="Post High School" value={education?.post_high_school} />
                <FieldRow label="Current Education" value={single.current_education} />
                <FieldRow label="Bachelor's" value={education?.bachelors_degree} />
                <FieldRow label="Graduate" value={education?.grad_degree} />
                <FieldRow label="Certifications" value={education?.certifications} />
                <FieldRow label="Occupation" value={single.occupation} />
                {education?.notes && (
                  <div className="py-2">
                    <p className="text-xs text-[#888888] mb-1">Education Notes</p>
                    <p className="text-sm text-[#1A1A1A] leading-relaxed">{education.notes}</p>
                  </div>
                )}

                <SectionHeading>Family</SectionHeading>
                <FieldRow label="Father" value={family?.fathers_name} />
                <FieldRow label="Father's Occupation" value={family?.fathers_occupation} />
                <FieldRow label="Mother" value={family?.mothers_name ? `${family.mothers_name}${family?.mothers_maiden_name ? ` (née ${family.mothers_maiden_name})` : ''}` : null} />
                <FieldRow label="Mother's Occupation" value={family?.mothers_occupation} />
                <FieldRow label="# Siblings" value={family?.num_siblings != null ? String(family.num_siblings) : null} />
                <div className="py-2 border-b border-gray-50">
                  <p className="text-xs text-[#888888] mb-1">Family Background</p>
                  <p className="text-sm text-[#1A1A1A] leading-relaxed">{single.family_background || '—'}</p>
                </div>
                {family?.family_notes && (
                  <div className="py-2">
                    <p className="text-xs text-[#888888] mb-1">Family Notes</p>
                    <p className="text-sm text-[#1A1A1A] leading-relaxed">{family.family_notes}</p>
                  </div>
                )}

                {references.length > 0 && (
                  <>
                    <SectionHeading>References</SectionHeading>
                    <div className="space-y-2">
                      {references.map((ref) => (
                        <div key={ref.id} className="p-3 rounded-lg bg-gray-50">
                          <p className="text-sm font-medium text-[#1A1A1A]">{ref.name}{ref.relationship ? ` — ${ref.relationship}` : ''}</p>
                          {(ref.phone || ref.email) && (
                            <p className="text-xs text-[#555555] mt-0.5">{[ref.phone, ref.email].filter(Boolean).join(' · ')}</p>
                          )}
                          {ref.notes && <p className="text-xs text-[#888888] mt-0.5">{ref.notes}</p>}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* About section */}
              <div className="lg:col-span-2 border-t border-gray-100 pt-4">
                <SectionHeading>About</SectionHeading>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-[#888888] mb-1">Bio</p>
                    <p className="text-sm text-[#1A1A1A] leading-relaxed">{single.about_bio || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#888888] mb-1">Looking For</p>
                    <p className="text-sm text-[#1A1A1A] leading-relaxed">{single.looking_for || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#888888] mb-1">Future Plans</p>
                    <p className="text-sm text-[#1A1A1A] leading-relaxed">{single.plans || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Familiar shadchanim */}
              <div className="lg:col-span-2 border-t border-gray-100 pt-4">
                <SectionHeading>Shadchanim Familiar With This Single</SectionHeading>
                {familiarShadchanim.length === 0 ? (
                  <p className="text-sm text-[#888888] py-2">No shadchanim have indicated familiarity with this single yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {familiarShadchanim.map((sh, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-[#FAFAFA] border border-gray-100">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#1A1A1A]">{sh.full_name}</p>
                          <p className="text-xs text-[#888888] mt-0.5">{sh.city}</p>
                          {sh.phone && <p className="text-xs text-[#555555] mt-0.5">{sh.phone}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── MATCHES TAB ── */}
          {activeTab === 'matches' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#1A1A1A]">Matches for {single.first_name}</h3>
                <Link href="/dashboard/matches">
                  <Button variant="pink" size="sm" className="gap-2"><Plus className="h-3.5 w-3.5" />New Match</Button>
                </Link>
              </div>
              {matches.length === 0 ? (
                <p className="text-sm text-[#888888] py-4">No matches yet.</p>
              ) : (
                <>
                  <div className="md:hidden space-y-3">
                    {matches.map((match) => (
                      <Link key={match.id} href={`/dashboard/matches/${match.id}`} className="block p-3 rounded-xl border border-gray-100 hover:border-brand-maroon/30 hover:bg-[#FBF5F9] transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-[#1A1A1A]">{match.otherName}</p>
                            <p className="text-xs text-[#888888] mt-0.5">{match.otherCity}</p>
                            <p className="text-xs text-[#AAAAAA] mt-1">{new Date(match.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                          </div>
                          <StatusBadge status={match.status} />
                        </div>
                      </Link>
                    ))}
                  </div>
                  <div className="hidden md:block">
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          <th className="table-th">Name</th>
                          <th className="table-th">Status</th>
                          <th className="table-th">City</th>
                          <th className="table-th">Date Suggested</th>
                        </tr>
                      </thead>
                      <tbody>
                        {matches.map((match) => (
                          <tr key={match.id} className="table-row">
                            <td className="table-td font-medium text-[#1A1A1A]">{match.otherName}</td>
                            <td className="table-td"><StatusBadge status={match.status} /></td>
                            <td className="table-td text-[#555555]">{match.otherCity}</td>
                            <td className="table-td text-[#555555]">{new Date(match.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── TASKS TAB ── */}
          {activeTab === 'tasks' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#1A1A1A]">Tasks for {single.first_name}</h3>
                <Link href="/dashboard/tasks">
                  <Button variant="outline-maroon" size="sm" className="gap-2"><Plus className="h-3.5 w-3.5" />Add Task</Button>
                </Link>
              </div>
              {tasks.length === 0 ? (
                <p className="text-sm text-[#888888] py-4">No tasks yet.</p>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 bg-[#FAFAFA]">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[#1A1A1A]">{task.title}</p>
                        <p className="text-xs text-[#888888] mt-0.5">
                          Due: {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${taskTypeClasses[task.type] ?? 'bg-gray-100 text-gray-600'}`}>
                        {taskTypeLabels[task.type] ?? task.type}
                      </span>
                      <StatusBadge status={task.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── DATING HISTORY TAB ── */}
          {activeTab === 'history' && (
            <div>
              <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-100 flex items-start gap-2">
                <Lock className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  <strong>Shadchan-private.</strong> Dating history is never shared with the single or anyone else.
                </p>
              </div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#1A1A1A]">Dating History for {single?.first_name}</h3>
                <Button variant="outline-maroon" size="sm" className="gap-1.5" onClick={openNewHistory}>
                  <Plus className="h-3.5 w-3.5" /> Add Entry
                </Button>
              </div>
              {datingHistory.length === 0 ? (
                <p className="text-sm text-[#888888] py-4">No dating history recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {datingHistory.map((entry) => (
                    <div key={entry.id} className="p-4 rounded-xl border border-gray-100 bg-[#FAFAFA]">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-[#1A1A1A]">{entry.person_name}</p>
                          {entry.date_approximate && <p className="text-xs text-[#888888] mt-0.5">{entry.date_approximate}</p>}
                          {entry.outcome && <p className="text-xs text-[#555555] mt-1">Outcome: {entry.outcome}</p>}
                          {entry.notes && <p className="text-xs text-[#888888] mt-1 whitespace-pre-wrap">{entry.notes}</p>}
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <button onClick={() => openEditHistory(entry)} className="p-1.5 text-[#888888] hover:text-brand-maroon transition-colors">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleDeleteHistory(entry.id)} className="p-1.5 text-[#888888] hover:text-red-500 transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── NOTES TAB (two-tier: private + public) ── */}
          {activeTab === 'notes' && (
            <div className="space-y-8">

              {/* ─── PRIVATE NOTES (dark / amber) ─────────────────────────────── */}
              <div className="rounded-2xl bg-[#2D2D2D] p-5">
                {/* Warning banner */}
                <div className="mb-4 flex items-start gap-2 rounded-lg bg-[#1A1A1A] px-3 py-2.5">
                  <Lock className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-400/80 leading-relaxed">
                    These notes are private. Only you can see them.
                  </p>
                </div>

                {/* Section heading */}
                <div className="flex items-center gap-2 mb-4">
                  <Lock className="h-4 w-4 text-amber-400" />
                  <span className="text-sm font-semibold text-amber-300">My Private Notes — Only visible to you</span>
                </div>

                {/* Formatting toolbar */}
                <div className="flex items-center gap-0.5 mb-2 p-1 rounded-lg bg-[#1A1A1A] w-fit">
                  <button
                    type="button"
                    onClick={() => applyFormat('bold')}
                    title="Bold"
                    className="p-1.5 rounded hover:bg-[#2D2D2D] text-amber-300 transition-colors"
                  >
                    <Bold className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormat('italic')}
                    title="Italic"
                    className="p-1.5 rounded hover:bg-[#2D2D2D] text-amber-300 transition-colors"
                  >
                    <Italic className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormat('bullet')}
                    title="Bullet List"
                    className="p-1.5 rounded hover:bg-[#2D2D2D] text-amber-300 transition-colors"
                  >
                    <List className="h-3.5 w-3.5" />
                  </button>
                  <div className="w-px h-4 bg-[#444444] mx-1" />
                  <input
                    ref={noteImageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleNoteImageUpload}
                  />
                  <button
                    type="button"
                    onClick={() => noteImageInputRef.current?.click()}
                    title="Attach image"
                    disabled={uploadingNoteImage}
                    className="p-1.5 rounded hover:bg-[#2D2D2D] text-amber-300/60 hover:text-amber-300 transition-colors disabled:opacity-50"
                  >
                    {uploadingNoteImage
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Paperclip className="h-3.5 w-3.5" />
                    }
                  </button>
                  <div className="ml-3 text-xs text-amber-400/50 min-w-[4rem]">
                    {privateNotesSaving ? 'Saving…' : privateNotesSaved ? '✓ Saved' : privateNotesDirty ? '• Unsaved' : ''}
                  </div>
                </div>

                {/* Textarea */}
                <textarea
                  ref={privateNotesTextareaRef}
                  value={privateNotes}
                  onChange={(e) => { setPrivateNotes(e.target.value); setPrivateNotesDirty(true) }}
                  rows={9}
                  placeholder={`Add private notes about ${single.first_name} here…`}
                  className="w-full bg-[#1E1E1E] text-amber-100 placeholder:text-amber-400/30 border border-[#444444] rounded-xl p-4 text-sm leading-relaxed resize-y focus:outline-none focus:ring-1 focus:ring-amber-500/40 focus:border-amber-500/50 font-mono"
                />

                {/* Attached note image */}
                {privateNoteImageSignedUrl && (
                  <div className="mt-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={privateNoteImageSignedUrl}
                      alt="Note attachment"
                      className="max-w-xs rounded-lg border border-[#444444]"
                    />
                  </div>
                )}
              </div>

              {/* ─── PUBLIC NOTES (light / warning) ───────────────────────────── */}
              <div className="rounded-2xl border-2 border-orange-200 bg-white p-5">
                {/* Warning banner */}
                <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
                  <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-700 font-semibold leading-relaxed">
                    ⚠️ PUBLIC — All shadchanim can read these notes. Do not include private information.
                  </p>
                </div>

                {/* Section heading */}
                <div className="flex items-center gap-2 mb-5">
                  <Globe className="h-4 w-4 text-[#555555]" />
                  <span className="text-sm font-semibold text-[#1A1A1A]">Public Notes — Visible to all shadchanim</span>
                </div>

                {/* Add note form */}
                <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-medium text-[#555555] mb-2">Add a public note</p>
                  <Textarea
                    value={newPublicNote}
                    onChange={(e) => setNewPublicNote(e.target.value)}
                    rows={3}
                    placeholder={`Share a public note about ${single.first_name} visible to all shadchanim…`}
                  />
                  <div className="mt-3 flex justify-end">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleAddPublicNote}
                      disabled={!newPublicNote.trim() || postingPublicNote}
                    >
                      {postingPublicNote ? 'Posting…' : 'Post Note'}
                    </Button>
                  </div>
                </div>

                {/* Notes list */}
                {publicNotesLoading ? (
                  <div className="flex items-center justify-center py-8 text-sm text-[#888888]">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading notes…
                  </div>
                ) : publicNotes.length === 0 ? (
                  <p className="text-sm text-[#888888] py-4 text-center">No public notes yet. Be the first to add one.</p>
                ) : (
                  <div className="space-y-3">
                    {publicNotes.map((note) => (
                      <div key={note.id} className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                        <p className="text-sm text-[#1A1A1A] leading-relaxed whitespace-pre-wrap">{note.note_text}</p>
                        <div className="mt-2.5 flex items-center justify-between gap-2">
                          <p className="text-xs text-[#888888]">
                            <span className="font-medium text-[#555555]">{note.shadchan_name}</span>
                            {' · '}
                            {new Date(note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                          {note.is_own && (
                            <button
                              onClick={() => handleDeletePublicNote(note.id)}
                              disabled={deletingNoteId === note.id}
                              className="text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                            >
                              {deletingNoteId === note.id ? 'Deleting…' : 'Delete'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Mobile sticky action bar */}
      <div className="sm:hidden fixed bottom-16 inset-x-0 z-20 bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-2">
        <Link href="/dashboard/matches" className="flex-1">
          <Button variant="pink" size="sm" className="gap-1.5 w-full justify-center">
            <Heart className="h-3.5 w-3.5" />Match
          </Button>
        </Link>
        <Link href="/dashboard/tasks" className="flex-1">
          <Button variant="outline-maroon" size="sm" className="gap-1.5 w-full justify-center">
            <Plus className="h-3.5 w-3.5" />Task
          </Button>
        </Link>
        <Button variant="secondary" size="sm" className="gap-1.5 flex-1 justify-center" onClick={() => setLabelsOpen(true)}>
          <Tag className="h-3.5 w-3.5" />Labels
        </Button>
      </div>

      {/* Dating history dialog */}
      <Dialog open={historyFormOpen} onOpenChange={(open) => { if (!open) setHistoryFormOpen(false) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingEntry ? 'Edit Dating History Entry' : 'Add Dating History Entry'}</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-2 space-y-4">
            <div>
              <label className="field-label block mb-1">Person Name *</label>
              <Input value={historyForm.person_name} placeholder="First name or initials"
                onChange={e => setHistoryForm(f => ({ ...f, person_name: e.target.value }))} />
            </div>
            <div>
              <label className="field-label block mb-1">Date (approx.)</label>
              <Input value={historyForm.date_approximate} placeholder="e.g. Spring 2023"
                onChange={e => setHistoryForm(f => ({ ...f, date_approximate: e.target.value }))} />
            </div>
            <div>
              <label className="field-label block mb-1">Outcome</label>
              <Input value={historyForm.outcome} placeholder="e.g. Didn't continue after date 2"
                onChange={e => setHistoryForm(f => ({ ...f, outcome: e.target.value }))} />
            </div>
            <div>
              <label className="field-label block mb-1">Notes</label>
              <Textarea rows={3} value={historyForm.notes} placeholder="Private notes"
                onChange={e => setHistoryForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setHistoryFormOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveHistory} disabled={savingHistory || !historyForm.person_name.trim()} className="gap-1.5">
              {savingHistory ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Labels dialog */}
      <Dialog open={labelsOpen} onOpenChange={(open) => { if (!open) setLabelsOpen(false) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Your Labels</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-2 space-y-4">
            <p className="text-xs text-[#888888]">
              Labels are <strong>private to you</strong>. Check a label to assign it to {single.first_name}.
            </p>
            <div className="space-y-2 max-h-52 overflow-y-auto">
              {labelLibrary.map((label) => (
                <label key={label.id} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={assignedIds.includes(label.id)}
                    onChange={() => toggleLabel(label.id)}
                    className="w-4 h-4 rounded border-gray-300 accent-brand-maroon"
                  />
                  <span className="text-sm text-[#1A1A1A]">{label.name}</span>
                </label>
              ))}
              {labelLibrary.length === 0 && (
                <p className="text-xs text-[#888888] text-center py-4">No labels yet. Create one below.</p>
              )}
            </div>
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-medium text-[#555555] mb-2">Create a new label</p>
              <div className="flex gap-2">
                <Input
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  placeholder="e.g. Top priority, Ready to date…"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateLabel() } }}
                  className="flex-1"
                />
                <Button variant="secondary" size="sm" onClick={handleCreateLabel} disabled={!newLabelName.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setLabelsOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
