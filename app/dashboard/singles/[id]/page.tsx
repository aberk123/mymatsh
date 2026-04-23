'use client'

import { useEffect, useState } from 'react'
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
  const [notes, setNotes] = useState('')
  const [notesSaved, setNotesSaved] = useState(false)
  const [notesSaving, setNotesSaving] = useState(false)
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

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      // Get shadchan profile
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (supabase.from('shadchan_profiles') as any)
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle() as { data: { id: string } | null }

      if (!profile) { setLoading(false); return }
      setProfileId(profile.id)

      // Load single
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: s } = await (supabase.from('singles') as any)
        .select('id, first_name, last_name, full_hebrew_name, gender, dob, age, phone, email, address, city, state, country, postal_code, height_inches, about_bio, current_education, occupation, high_schools, eretz_yisroel, current_yeshiva_seminary, family_background, siblings, looking_for, plans, hashkafa, photo_url, status')
        .eq('id', id)
        .maybeSingle() as { data: SingleDetail | null }

      if (!s) { setLoading(false); return }
      setSingle(s)

      // Load supplemental data in parallel
      const [eduRes, famRes, refsRes, photosRes, historyRes, famShadRes] = await Promise.all([
        fetch(`/api/singles/${id}/education`),
        fetch(`/api/singles/${id}/family`),
        fetch(`/api/singles/${id}/references`),
        fetch(`/api/singles/${id}/photos`),
        fetch(`/api/singles/${id}/dating-history`),
        fetch(`/api/singles/${id}/familiar-shadchanim`),
      ])
      const [eduData, famData, refsData, photosData, historyData, famShadData] = await Promise.all([
        eduRes.json(), famRes.json(), refsRes.json(), photosRes.json(), historyRes.json(), famShadRes.json(),
      ])
      if (eduData.education) setEducation(eduData.education)
      if (famData.family) setFamily(famData.family)
      if (refsData.references?.length) setReferences(refsData.references)
      if (photosData.photos?.length) setSinglePhotos(photosData.photos)
      if (historyData.history?.length) setDatingHistory(historyData.history)
      if (famShadData.shadchanim?.length) setFamiliarShadchanim(famShadData.shadchanim)

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
          return {
            ...m,
            otherName: otherMap[otherId]?.name ?? '—',
            otherCity: otherMap[otherId]?.city ?? '—',
          }
        }))
      }

      // Load tasks for this single
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

      // Load assigned labels for this single
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: slData } = await (supabase.from('single_labels') as any)
        .select('label_id')
        .eq('single_id', id) as { data: Array<{ label_id: string }> | null }

      setAssignedIds((slData ?? []).map((sl) => sl.label_id))

      // Load notes (stored as a calendar_task of type 'note')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: noteTask } = await (supabase.from('calendar_tasks') as any)
        .select('id, notes')
        .eq('single_id', id)
        .eq('shadchan_id', profile.id)
        .eq('type', 'note')
        .maybeSingle() as { data: { id: string; notes: string | null } | null }

      if (noteTask?.notes) setNotes(noteTask.notes)

      setLoading(false)
    }
    load()
  }, [id])

  async function toggleLabel(labelId: string) {
    const supabase = createClient()
    if (assignedIds.includes(labelId)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('single_labels') as any)
        .delete()
        .eq('single_id', id)
        .eq('label_id', labelId)
      setAssignedIds((prev) => prev.filter((x) => x !== labelId))
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('single_labels') as any)
        .insert({ single_id: id, label_id: labelId })
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
      await (supabase.from('single_labels') as any)
        .insert({ single_id: id, label_id: newLabel.id })
      setAssignedIds((prev) => [...prev, newLabel.id])
    }
    setNewLabelName('')
  }

  async function handleSaveNotes() {
    if (!profileId) return
    setNotesSaving(true)
    const supabase = createClient()

    // Check if note task exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase.from('calendar_tasks') as any)
      .select('id')
      .eq('single_id', id)
      .eq('shadchan_id', profileId)
      .eq('type', 'note')
      .maybeSingle() as { data: { id: string } | null }

    if (existing) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('calendar_tasks') as any)
        .update({ notes })
        .eq('id', existing.id)
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('calendar_tasks') as any)
        .insert({
          shadchan_id: profileId,
          single_id: id,
          title: 'Private Note',
          type: 'note',
          due_date: new Date().toISOString().slice(0, 10),
          status: 'pending',
          notes,
        })
    }

    setNotesSaving(false)
    setNotesSaved(true)
    setTimeout(() => setNotesSaved(false), 2000)
  }

  const assignedLabels = labelLibrary.filter((l) => assignedIds.includes(l.id))

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
        single,
        education: education ?? undefined,
        family: family ?? undefined,
        references,
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
      if (res.ok) {
        setDatingHistory(prev => prev.map(e => e.id === editingEntry.id ? { ...e, ...historyForm } : e))
      }
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

  const tabs: { key: Tab; label: string }[] = [
    { key: 'profile', label: 'Profile' },
    { key: 'matches', label: `Matches (${matches.length})` },
    { key: 'tasks', label: `Tasks (${tasks.length})` },
    { key: 'history', label: `Dating History (${datingHistory.length})` },
    { key: 'notes', label: 'My Notes' },
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
          <Link href="/dashboard/singles">
            <Button variant="secondary">Back to My Singles</Button>
          </Link>
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

      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          <Avatar name={`${single.first_name} ${single.last_name}`} imageUrl={single.photo_url} size="xl" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-[#1A1A1A]">
                  {single.first_name} {single.last_name}
                </h1>
                {single.full_hebrew_name && (
                  <p className="text-base text-[#888888] mt-0.5 font-medium" dir="rtl">
                    {single.full_hebrew_name}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  {single.age && <span className="text-sm text-[#555555]">Age {single.age}</span>}
                  {single.age && (single.city || single.state) && <span className="text-[#DDDDDD]">•</span>}
                  {(single.city || single.state) && (
                    <span className="text-sm text-[#555555]">
                      {[single.city, single.state].filter(Boolean).join(', ')}
                    </span>
                  )}
                  <span className="text-[#DDDDDD]">•</span>
                  <StatusBadge status={single.status} />
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 flex-wrap">
                <Link href="/dashboard/matches">
                  <Button variant="pink" size="sm" className="gap-2">
                    <Heart className="h-3.5 w-3.5" />
                    Create Match
                  </Button>
                </Link>
                <Link href="/dashboard/tasks">
                  <Button variant="outline-maroon" size="sm" className="gap-2">
                    <Plus className="h-3.5 w-3.5" />
                    Add Task
                  </Button>
                </Link>
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-2"
                  onClick={() => setLabelsOpen(true)}
                >
                  <Tag className="h-3.5 w-3.5" />
                  Manage Labels
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-2"
                  onClick={handlePdfDownload}
                  disabled={pdfGenerating}
                >
                  {pdfGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
                  Download PDF
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

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
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Photos */}
              {singlePhotos.length > 0 && (
                <div className="lg:col-span-2">
                  <SectionHeading>Photos</SectionHeading>
                  <div className="flex gap-3 overflow-x-auto pb-1">
                    {singlePhotos.map((p, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={p.id} src={p.public_url} alt={`Photo ${i + 1}`}
                        className={`h-24 w-24 rounded-xl object-cover flex-shrink-0 border-2 ${i === 0 ? 'border-brand-maroon' : 'border-gray-200'}`} />
                    ))}
                  </div>
                </div>
              )}

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

          {activeTab === 'matches' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#1A1A1A]">Matches for {single.first_name}</h3>
                <Link href="/dashboard/matches">
                  <Button variant="pink" size="sm" className="gap-2">
                    <Plus className="h-3.5 w-3.5" />
                    New Match
                  </Button>
                </Link>
              </div>
              {matches.length === 0 ? (
                <p className="text-sm text-[#888888] py-4">No matches yet.</p>
              ) : (
                <>
                  {/* Mobile cards */}
                  <div className="md:hidden space-y-3">
                    {matches.map((match) => (
                      <Link key={match.id} href={`/dashboard/matches/${match.id}`} className="block p-3 rounded-xl border border-gray-100 hover:border-brand-maroon/30 hover:bg-[#FBF5F9] transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-[#1A1A1A]">{match.otherName}</p>
                            <p className="text-xs text-[#888888] mt-0.5">{match.otherCity}</p>
                            <p className="text-xs text-[#AAAAAA] mt-1">
                              {new Date(match.created_at).toLocaleDateString('en-US', {
                                month: 'short', day: 'numeric', year: 'numeric',
                              })}
                            </p>
                          </div>
                          <StatusBadge status={match.status} />
                        </div>
                      </Link>
                    ))}
                  </div>
                  {/* Desktop table */}
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
                            <td className="table-td text-[#555555]">
                              {new Date(match.created_at).toLocaleDateString('en-US', {
                                month: 'short', day: 'numeric', year: 'numeric',
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'tasks' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#1A1A1A]">Tasks for {single.first_name}</h3>
                <Link href="/dashboard/tasks">
                  <Button variant="outline-maroon" size="sm" className="gap-2">
                    <Plus className="h-3.5 w-3.5" />
                    Add Task
                  </Button>
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
                          Due: {new Date(task.due_date).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric',
                          })}
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

          {activeTab === 'notes' && (
            <div>
              <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-100 flex items-start gap-2">
                <Lock className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  <strong>Private notes — visible only to you.</strong> These notes are never shared with {single.first_name}, their parents, or other shadchanim.
                </p>
              </div>
              <h3 className="font-semibold text-[#1A1A1A] mb-3">My Notes for {single.first_name}</h3>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={8}
                placeholder="Add private notes about this single here…"
              />
              <div className="mt-3 flex items-center gap-3">
                <Button variant="primary" size="sm" onClick={handleSaveNotes} disabled={notesSaving}>
                  {notesSaving ? 'Saving…' : 'Save Notes'}
                </Button>
                {notesSaved && (
                  <span className="text-xs text-green-600 font-medium">Saved!</span>
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
            <Heart className="h-3.5 w-3.5" />
            Match
          </Button>
        </Link>
        <Link href="/dashboard/tasks" className="flex-1">
          <Button variant="outline-maroon" size="sm" className="gap-1.5 w-full justify-center">
            <Plus className="h-3.5 w-3.5" />
            Task
          </Button>
        </Link>
        <Button variant="secondary" size="sm" className="gap-1.5 flex-1 justify-center" onClick={() => setLabelsOpen(true)}>
          <Tag className="h-3.5 w-3.5" />
          Labels
        </Button>
      </div>

      {/* Dating history form dialog */}
      <Dialog open={historyFormOpen} onOpenChange={(open) => { if (!open) setHistoryFormOpen(false) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingEntry ? 'Edit Dating History Entry' : 'Add Dating History Entry'}</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-2 space-y-4">
            <div>
              <label className="field-label block mb-1">Person Name *</label>
              <Input className="input-base" value={historyForm.person_name} placeholder="First name or initials"
                onChange={e => setHistoryForm(f => ({ ...f, person_name: e.target.value }))} />
            </div>
            <div>
              <label className="field-label block mb-1">Date (approx.)</label>
              <Input className="input-base" value={historyForm.date_approximate} placeholder="e.g. Spring 2023"
                onChange={e => setHistoryForm(f => ({ ...f, date_approximate: e.target.value }))} />
            </div>
            <div>
              <label className="field-label block mb-1">Outcome</label>
              <Input className="input-base" value={historyForm.outcome} placeholder="e.g. Didn't continue after date 2"
                onChange={e => setHistoryForm(f => ({ ...f, outcome: e.target.value }))} />
            </div>
            <div>
              <label className="field-label block mb-1">Notes</label>
              <Textarea rows={3} className="input-base text-sm" value={historyForm.notes} placeholder="Private notes"
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
                <label
                  key={label.id}
                  className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
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
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCreateLabel}
                  disabled={!newLabelName.trim()}
                >
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
