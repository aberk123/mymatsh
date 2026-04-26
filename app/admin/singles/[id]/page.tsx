'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Building2,
  Heart,
  Newspaper,
  DollarSign,
  ClipboardList,
  UsersRound,
  Home,
  BookOpen,
  MessageSquare,
  PackageOpen,
  ChevronLeft,
  RefreshCw,
  Trash2,
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Users2,
  Star,
} from 'lucide-react'
import { toast } from 'sonner'
import { AppLayout } from '@/components/ui/app-layout'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import type { NavItem } from '@/components/ui/sidebar'

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Shadchanim', href: '/admin/shadchanim', icon: UserCheck },
  { label: 'Singles', href: '/admin/singles', icon: UsersRound },
  { label: 'Parents', href: '/admin/parents', icon: Home },
  { label: 'Advocates', href: '/admin/advocates', icon: Heart },
  { label: 'Maschilim', href: '/admin/maschilim', icon: BookOpen },
  { label: 'Messages', href: '/admin/messages', icon: MessageSquare },
  { label: 'Organizations', href: '/admin/organizations', icon: Building2 },
  { label: 'News', href: '/admin/news', icon: Newspaper },
  { label: 'Donations', href: '/admin/donations', icon: DollarSign },
  { label: 'Audit Log', href: '/admin/audit-log', icon: ClipboardList },
  { label: 'Import Batches', href: '/admin/import-batches', icon: PackageOpen },
]

type SingleStatus = 'draft' | 'available' | 'on_hold' | 'engaged' | 'married' | 'inactive'

const STATUS_OPTIONS: { value: SingleStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'available', label: 'Available' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'engaged', label: 'Engaged' },
  { value: 'married', label: 'Married' },
  { value: 'inactive', label: 'Inactive' },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SingleRecord = Record<string, any>
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EducationRecord = Record<string, any> | null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FamilyRecord = Record<string, any> | null

interface Photo { id: string; public_url: string; position: number; caption: string | null }
interface ShadchanEntry { shadchan_id: string; is_familiar: boolean; full_name: string; email: string | null; city: string | null }
interface CreatorShadchan { id: string; full_name: string; email: string | null; phone: string | null; city: string | null }
interface AvailableShadchan { id: string; full_name: string; city: string | null }

interface DetailPayload {
  single: SingleRecord
  education: EducationRecord
  family: FamilyRecord
  photos: Photo[]
  creatorShadchan: CreatorShadchan | null
  shadchanList: ShadchanEntry[]
  availableShadchanim: AvailableShadchan[]
}

function fmtHeight(inches: number | null | undefined): string {
  if (!inches) return '—'
  return `${Math.floor(inches / 12)}'${inches % 12}"`
}

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div>
      <p className="text-xs font-medium text-[#888888] uppercase tracking-wide">{label}</p>
      <p className="text-sm text-[#1A1A1A] mt-0.5">{value || '—'}</p>
    </div>
  )
}

export default function AdminSingleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DetailPayload | null>(null)
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [newStatus, setNewStatus] = useState<SingleStatus>('available')
  const [statusSaving, setStatusSaving] = useState(false)
  const [statusError, setStatusError] = useState('')
  const [assignShadchanId, setAssignShadchanId] = useState('')
  const [assignSaving, setAssignSaving] = useState(false)
  const [assignError, setAssignError] = useState('')
  const [assignSuccess, setAssignSuccess] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/admin/singles/${id}`)
      if (res.ok) {
        const payload = await res.json() as DetailPayload
        setData(payload)
        setNewStatus(payload.single.status as SingleStatus)
      }
      setLoading(false)
    }
    load()
  }, [id])

  async function handleStatusSave() {
    if (!data) return
    setStatusSaving(true)
    setStatusError('')
    const res = await fetch(`/api/admin/singles/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      setData(prev => prev ? { ...prev, single: { ...prev.single, status: newStatus } } : prev)
      setStatusModalOpen(false)
    } else {
      const json = await res.json()
      setStatusError(json.error ?? 'Failed to update status.')
    }
    setStatusSaving(false)
  }

  async function handleAssignShadchan() {
    if (!assignShadchanId) return
    setAssignSaving(true)
    setAssignError('')
    setAssignSuccess(false)
    const res = await fetch(`/api/admin/singles/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ created_by_shadchan_id: assignShadchanId }),
    })
    if (res.ok) {
      const selected = data?.availableShadchanim.find(s => s.id === assignShadchanId)
      if (selected) {
        setData(prev => prev ? {
          ...prev,
          creatorShadchan: { id: selected.id, full_name: selected.full_name, email: null, phone: null, city: selected.city },
          single: { ...prev.single, created_by_shadchan_id: assignShadchanId },
        } : prev)
      }
      setAssignSuccess(true)
      setAssignShadchanId('')
    } else {
      const json = await res.json()
      setAssignError(json.error ?? 'Failed to assign shadchan.')
    }
    setAssignSaving(false)
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/singles/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        toast.error((json as { error?: string }).error ?? 'Failed to delete.')
        return
      }
      toast.success('Single profile deleted.')
      router.push('/admin/singles')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <AppLayout navItems={navItems} title="Single Details" role="platform_admin">
        <div className="flex items-center justify-center py-24 text-[#888888] text-sm">Loading…</div>
      </AppLayout>
    )
  }

  if (!data) {
    return (
      <AppLayout navItems={navItems} title="Single Details" role="platform_admin">
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <p className="text-[#555555]">Single not found.</p>
          <Link href="/admin/singles"><Button variant="secondary">← Back to Singles</Button></Link>
        </div>
      </AppLayout>
    )
  }

  const { single, education, family, photos, creatorShadchan, shadchanList, availableShadchanim } = data
  const fullName = `${single.first_name} ${single.last_name}`
  const familiarShadchanim = shadchanList.filter(s => s.is_familiar)

  return (
    <AppLayout navItems={navItems} title={fullName} role="platform_admin">
      <div className="max-w-4xl mx-auto space-y-5">

        {/* Back + header */}
        <div>
          <button
            onClick={() => router.push('/admin/singles')}
            className="inline-flex items-center gap-1.5 text-sm text-[#555555] hover:text-brand-maroon transition-colors mb-4"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Singles
          </button>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-brand-maroon/10 flex items-center justify-center flex-shrink-0">
                <User className="h-6 w-6 text-brand-maroon" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-[#1A1A1A]">{fullName}</h1>
                {single.full_hebrew_name && (
                  <p className="text-sm text-[#888888] mt-0.5">{single.full_hebrew_name}</p>
                )}
                <div className="flex items-center gap-2 mt-1.5">
                  <StatusBadge status={single.status} />
                  <span className="text-xs text-[#888888] capitalize">{single.gender}</span>
                  {single.age && <span className="text-xs text-[#888888]">· Age {single.age}</span>}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="gap-1.5"
                onClick={() => { setNewStatus(single.status as SingleStatus); setStatusModalOpen(true) }}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Edit Status
              </Button>
              <Button
                variant="danger"
                size="sm"
                className="gap-1.5"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Personal Info */}
        <div className="card">
          <h2 className="text-base font-semibold text-[#1A1A1A] mb-4 flex items-center gap-2">
            <User className="h-4 w-4 text-brand-maroon" /> Personal Info
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Field label="First Name" value={single.first_name} />
            <Field label="Last Name" value={single.last_name} />
            <Field label="Gender" value={single.gender} />
            <Field label="Age" value={single.age} />
            <Field label="Date of Birth" value={single.dob} />
            <Field label="Height" value={fmtHeight(single.height_inches)} />
            <Field label="City" value={single.city} />
            <Field label="State" value={single.state} />
            <Field label="Country" value={single.country} />
            <Field label="Address" value={single.address} />
            <Field label="Occupation" value={single.occupation} />
            <Field label="Languages" value={single.languages} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-sm text-[#555555]">
              <Mail className="h-4 w-4 text-[#888888] flex-shrink-0" />
              {single.email ? <a href={`mailto:${single.email}`} className="hover:underline">{single.email}</a> : '—'}
            </div>
            <div className="flex items-center gap-2 text-sm text-[#555555]">
              <Phone className="h-4 w-4 text-[#888888] flex-shrink-0" />
              {single.phone ? <a href={`tel:${single.phone}`} className="hover:underline">{single.phone}</a> : '—'}
            </div>
          </div>
        </div>

        {/* Profile */}
        <div className="card">
          <h2 className="text-base font-semibold text-[#1A1A1A] mb-4 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-brand-maroon" /> Profile
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
            <Field label="Hashkafa" value={single.hashkafa} />
            <Field label="Plans" value={single.plans} />
            <Field label="Eretz Yisroel" value={single.eretz_yisroel} />
            <Field label="Yeshiva / Seminary" value={single.current_yeshiva_seminary} />
            <Field label="Minyan Attendance" value={single.minyan_attendance} />
            <Field label="Smoking" value={single.smoking} />
          </div>
          {single.about_bio && (
            <div className="mb-3">
              <p className="text-xs font-medium text-[#888888] uppercase tracking-wide mb-1">About / Bio</p>
              <p className="text-sm text-[#1A1A1A] whitespace-pre-wrap">{single.about_bio}</p>
            </div>
          )}
          {single.looking_for && (
            <div className="mb-3">
              <p className="text-xs font-medium text-[#888888] uppercase tracking-wide mb-1">Looking For</p>
              <p className="text-sm text-[#1A1A1A] whitespace-pre-wrap">{single.looking_for}</p>
            </div>
          )}
          {single.family_background && (
            <div>
              <p className="text-xs font-medium text-[#888888] uppercase tracking-wide mb-1">Family Background</p>
              <p className="text-sm text-[#1A1A1A] whitespace-pre-wrap">{single.family_background}</p>
            </div>
          )}
        </div>

        {/* Education */}
        {education && (
          <div className="card">
            <h2 className="text-base font-semibold text-[#1A1A1A] mb-4 flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-brand-maroon" /> Education
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Field label="Elementary School" value={education.elementary_school} />
              <Field label="Post High School" value={education.post_high_school} />
              <Field label="Bachelor's Degree" value={education.bachelors_degree} />
              <Field label="Grad Degree" value={education.grad_degree} />
              <Field label="Certifications" value={education.certifications} />
              <Field label="Currently In School" value={education.currently_in_school ? 'Yes' : 'No'} />
            </div>
            {education.notes && (
              <div className="mt-3">
                <p className="text-xs font-medium text-[#888888] uppercase tracking-wide mb-1">Notes</p>
                <p className="text-sm text-[#1A1A1A]">{education.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Family Details */}
        {family && (
          <div className="card">
            <h2 className="text-base font-semibold text-[#1A1A1A] mb-4 flex items-center gap-2">
              <Users2 className="h-4 w-4 text-brand-maroon" /> Family
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Field label="Father's Name" value={family.fathers_name} />
              <Field label="Father's Occupation" value={family.fathers_occupation} />
              <Field label="Father's Phone" value={family.father_phone} />
              <Field label="Father's Email" value={family.father_email} />
              <Field label="Mother's Name" value={family.mothers_name} />
              <Field label="Mother's Maiden Name" value={family.mothers_maiden_name} />
              <Field label="Mother's Occupation" value={family.mothers_occupation} />
              <Field label="Mother's Phone" value={family.mother_phone} />
              <Field label="Mother's Email" value={family.mother_email} />
              <Field label="# Siblings" value={family.num_siblings} />
              <Field label="Family Shul" value={family.family_shul_name} />
              <Field label="Family Rav" value={family.family_rav_name} />
            </div>
            {family.family_notes && (
              <div className="mt-3">
                <p className="text-xs font-medium text-[#888888] uppercase tracking-wide mb-1">Notes</p>
                <p className="text-sm text-[#1A1A1A]">{family.family_notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Photos */}
        {(photos.length > 0 || single.photo_url) && (
          <div className="card">
            <h2 className="text-base font-semibold text-[#1A1A1A] mb-4">Photos</h2>
            <div className="flex flex-wrap gap-3">
              {single.photo_url && (
                <a href={single.photo_url} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={single.photo_url}
                    alt="Profile photo"
                    className="h-32 w-32 object-cover rounded-lg border border-gray-200"
                  />
                </a>
              )}
              {photos.map(p => (
                <a key={p.id} href={p.public_url} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.public_url}
                    alt={p.caption ?? 'Photo'}
                    className="h-32 w-32 object-cover rounded-lg border border-gray-200"
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Shadchan Info */}
        <div className="card">
          <h2 className="text-base font-semibold text-[#1A1A1A] mb-4 flex items-center gap-2">
            <Star className="h-4 w-4 text-brand-maroon" /> Shadchan Info
          </h2>

          <div className="mb-4 pb-4 border-b border-gray-100">
            <p className="text-xs font-medium text-[#888888] uppercase tracking-wide mb-2">Assigned Shadchan</p>
            {creatorShadchan ? (
              <div className="flex items-center gap-3 mb-3">
                <div>
                  <p className="text-sm font-medium text-[#1A1A1A]">{creatorShadchan.full_name}</p>
                  <p className="text-xs text-[#888888]">
                    {[creatorShadchan.email, creatorShadchan.city].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                No shadchan assigned — this single is unrepresented.
              </p>
            )}
            {availableShadchanim.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  className="input-base flex-1 min-w-[200px]"
                  value={assignShadchanId}
                  onChange={e => { setAssignShadchanId(e.target.value); setAssignError(''); setAssignSuccess(false) }}
                >
                  <option value="">
                    {creatorShadchan ? '— Reassign shadchan…' : '— Assign a shadchan…'}
                  </option>
                  {availableShadchanim.map(sh => (
                    <option key={sh.id} value={sh.id}>
                      {sh.full_name}{sh.city ? ` (${sh.city})` : ''}
                    </option>
                  ))}
                </select>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!assignShadchanId || assignSaving}
                  onClick={handleAssignShadchan}
                >
                  {assignSaving ? 'Saving…' : 'Assign'}
                </Button>
              </div>
            )}
            {assignError && <p className="text-xs text-red-600 mt-2">{assignError}</p>}
            {assignSuccess && <p className="text-xs text-green-600 mt-2">Shadchan assigned successfully.</p>}
          </div>

          <div>
            <p className="text-xs font-medium text-[#888888] uppercase tracking-wide mb-2">
              In Shadchan Lists ({shadchanList.length})
              {familiarShadchanim.length > 0 && (
                <span className="ml-2 text-brand-maroon normal-case font-normal">
                  · {familiarShadchanim.length} familiar
                </span>
              )}
            </p>
            {shadchanList.length === 0 ? (
              <p className="text-sm text-[#888888]">Not in any shadchan&apos;s list.</p>
            ) : (
              <div className="space-y-2">
                {shadchanList.map((sh, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <div>
                      <span className="text-sm font-medium text-[#1A1A1A]">{sh.full_name}</span>
                      {sh.city && <span className="text-xs text-[#888888] ml-2">{sh.city}</span>}
                    </div>
                    {sh.is_familiar && (
                      <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
                        Familiar
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onOpenChange={(open) => { if (!open) setDeleteOpen(false) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Single Profile</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-2">
            <p className="text-sm text-[#555555]">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-[#1A1A1A]">{fullName}</span>?
              This will permanently remove their profile, all match records they are part of, and unlink them from any shadchan. This cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="secondary" size="md" onClick={() => setDeleteOpen(false)} disabled={deleting}>Cancel</Button>
            <Button variant="danger" size="md" disabled={deleting} onClick={handleDelete}>
              {deleting ? 'Deleting…' : 'Delete Profile'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Status Modal */}
      <Dialog open={statusModalOpen} onOpenChange={(open) => { if (!open) setStatusModalOpen(false) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Update Status</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-2 space-y-3">
            <p className="text-sm text-[#555555]">Change status for <strong>{fullName}</strong></p>
            <select
              className="input-base w-full"
              value={newStatus}
              onChange={e => setNewStatus(e.target.value as SingleStatus)}
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {statusError && <p className="text-sm text-red-600">{statusError}</p>}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setStatusModalOpen(false)}>Cancel</Button>
            <Button variant="primary" disabled={statusSaving} onClick={handleStatusSave}>
              {statusSaving ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
