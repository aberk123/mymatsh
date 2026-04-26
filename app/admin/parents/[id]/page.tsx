'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, Users, UserCheck, Building2, Heart, Newspaper,
  DollarSign, ClipboardList, UsersRound, Home, BookOpen, MessageSquare,
  PackageOpen, ChevronLeft, User, Mail, Phone, Pencil, Trash2, X, Check,
} from 'lucide-react'
import { toast } from 'sonner'
import { AppLayout } from '@/components/ui/app-layout'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
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

interface ParentDetailData {
  parent: {
    id: string; user_id: string | null; full_name: string; email: string | null
    phone: string | null; city: string | null; child_id: string | null
    profile_status: string | null; created_at: string
  }
  child: { id: string; first_name: string; last_name: string; status: string; gender: string } | null
  userEmail: string | null
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs font-medium text-[#888888] uppercase tracking-wide">{label}</p>
      <p className="text-sm text-[#1A1A1A] mt-0.5">{value || '—'}</p>
    </div>
  )
}

export default function AdminParentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ParentDetailData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteMode, setDeleteMode] = useState<'parent_only' | 'parent_and_child'>('parent_only')
  const [deleting, setDeleting] = useState(false)

  const [form, setForm] = useState({ full_name: '', email: '', phone: '', city: '', profile_status: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/parents/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then((d: ParentDetailData | null) => {
        setData(d)
        if (d) {
          setForm({
            full_name: d.parent.full_name ?? '',
            email: d.parent.email ?? d.userEmail ?? '',
            phone: d.parent.phone ?? '',
            city: d.parent.city ?? '',
            profile_status: d.parent.profile_status ?? '',
          })
        }
        setLoading(false)
      })
  }, [id])

  function startEdit() {
    if (!data) return
    setForm({
      full_name: data.parent.full_name ?? '',
      email: data.parent.email ?? data.userEmail ?? '',
      phone: data.parent.phone ?? '',
      city: data.parent.city ?? '',
      profile_status: data.parent.profile_status ?? '',
    })
    setIsEditing(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/parents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        toast.error((json as { error?: string }).error ?? 'Failed to save changes.')
        return
      }
      setData(prev => prev ? {
        ...prev,
        parent: { ...prev.parent, ...form, email: form.email || null, phone: form.phone || null, city: form.city || null, profile_status: form.profile_status || null },
      } : prev)
      setIsEditing(false)
      toast.success('Parent profile updated.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/parents/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: deleteMode }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        toast.error((json as { error?: string }).error ?? 'Failed to delete.')
        return
      }
      toast.success('Parent account deleted.')
      router.push('/admin/parents')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <AppLayout navItems={navItems} title="Parent Details" role="platform_admin">
        <div className="flex items-center justify-center py-24 text-[#888888] text-sm">Loading…</div>
      </AppLayout>
    )
  }

  if (!data) {
    return (
      <AppLayout navItems={navItems} title="Parent Details" role="platform_admin">
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <p className="text-[#555555]">Parent not found.</p>
          <Link href="/admin/parents"><Button variant="secondary">← Back to Parents</Button></Link>
        </div>
      </AppLayout>
    )
  }

  const { parent, child, userEmail } = data
  const displayEmail = parent.email ?? userEmail
  const dateJoined = new Date(parent.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <AppLayout navItems={navItems} title={parent.full_name} role="platform_admin">
      <div className="max-w-4xl mx-auto space-y-5">

        <div>
          <button
            onClick={() => router.push('/admin/parents')}
            className="inline-flex items-center gap-1.5 text-sm text-[#555555] hover:text-brand-maroon transition-colors mb-4"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Parents
          </button>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-brand-maroon/10 flex items-center justify-center flex-shrink-0">
                <User className="h-6 w-6 text-brand-maroon" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-[#1A1A1A]">{parent.full_name}</h1>
                {parent.profile_status && (
                  <div className="mt-1.5"><StatusBadge status={parent.profile_status} /></div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {!isEditing && (
                <Button variant="secondary" size="sm" className="gap-1.5" onClick={startEdit}>
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
              )}
              <Button variant="danger" size="sm" className="gap-1.5" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Parent Info */}
        <div className="card">
          <h2 className="text-base font-semibold text-[#1A1A1A] mb-4 flex items-center gap-2">
            <User className="h-4 w-4 text-brand-maroon" /> Parent Info
          </h2>

          {isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="field-label">Full Name</Label>
                  <Input className="mt-1" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
                </div>
                <div>
                  <Label className="field-label">Email</Label>
                  <Input className="mt-1" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <Label className="field-label">Phone</Label>
                  <Input className="mt-1" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div>
                  <Label className="field-label">City</Label>
                  <Input className="mt-1" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
                </div>
                <div>
                  <Label className="field-label">Status</Label>
                  <Input className="mt-1" value={form.profile_status} onChange={e => setForm(f => ({ ...f, profile_status: e.target.value }))} placeholder="e.g. active" />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" className="gap-1.5" disabled={saving} onClick={handleSave}>
                  <Check className="h-3.5 w-3.5" />{saving ? 'Saving…' : 'Save'}
                </Button>
                <Button variant="secondary" size="sm" className="gap-1.5" disabled={saving} onClick={() => setIsEditing(false)}>
                  <X className="h-3.5 w-3.5" /> Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <Field label="Full Name" value={parent.full_name} />
                <Field label="City" value={parent.city} />
                <Field label="Status" value={parent.profile_status} />
                <Field label="Date Joined" value={dateJoined} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-sm text-[#555555]">
                  <Mail className="h-4 w-4 text-[#888888] flex-shrink-0" />
                  {displayEmail ? <a href={`mailto:${displayEmail}`} className="hover:underline">{displayEmail}</a> : '—'}
                </div>
                <div className="flex items-center gap-2 text-sm text-[#555555]">
                  <Phone className="h-4 w-4 text-[#888888] flex-shrink-0" />
                  {parent.phone ? <a href={`tel:${parent.phone}`} className="hover:underline">{parent.phone}</a> : '—'}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Linked Child */}
        <div className="card">
          <h2 className="text-base font-semibold text-[#1A1A1A] mb-4 flex items-center gap-2">
            <UsersRound className="h-4 w-4 text-brand-maroon" /> Linked Child
          </h2>
          {child ? (
            <div
              className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => router.push(`/admin/singles/${child.id}`)}
            >
              <div>
                <p className="text-sm font-medium text-brand-maroon hover:underline">
                  {child.first_name} {child.last_name}
                </p>
                <p className="text-xs text-[#888888] capitalize mt-0.5">{child.gender}</p>
              </div>
              <StatusBadge status={child.status} />
            </div>
          ) : (
            <p className="text-sm text-[#888888]">No child single linked to this parent.</p>
          )}
        </div>

      </div>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={o => { if (!o) setDeleteOpen(false) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Parent Account</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-2 space-y-3">
            <p className="text-sm text-[#555555]">
              Choose how to delete{' '}
              <span className="font-semibold text-[#1A1A1A]">{parent.full_name}</span>:
            </p>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                className="mt-0.5"
                name="deleteMode"
                value="parent_only"
                checked={deleteMode === 'parent_only'}
                onChange={() => setDeleteMode('parent_only')}
              />
              <div>
                <p className="text-sm font-medium text-[#1A1A1A]">Delete parent account only</p>
                <p className="text-xs text-[#888888] mt-0.5">
                  Removes the parent account. Their child single remains in the system, unlinked.
                </p>
              </div>
            </label>
            {child && (
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  className="mt-0.5"
                  name="deleteMode"
                  value="parent_and_child"
                  checked={deleteMode === 'parent_and_child'}
                  onChange={() => setDeleteMode('parent_and_child')}
                />
                <div>
                  <p className="text-sm font-medium text-[#1A1A1A]">Delete parent account AND child profile</p>
                  <p className="text-xs text-[#888888] mt-0.5">
                    Removes both the parent account and{' '}
                    <span className="font-medium">{child.first_name} {child.last_name}</span>&apos;s single profile, including all match records. This cannot be undone.
                  </p>
                </div>
              </label>
            )}
          </div>
          <DialogFooter>
            <Button variant="secondary" size="md" onClick={() => setDeleteOpen(false)} disabled={deleting}>Cancel</Button>
            <Button variant="danger" size="md" disabled={deleting} onClick={handleDelete}>
              {deleting ? 'Deleting…' : 'Confirm Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </AppLayout>
  )
}
