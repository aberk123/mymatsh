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

interface ShadchanData {
  userRow: { id: string; email: string | null; phone: string | null; status: string; created_at: string }
  profile: {
    id: string; user_id: string; full_name: string; email: string | null; phone: string | null
    city: string | null; state: string | null; is_approved: boolean; approved_at: string | null
    organization_id: string | null; created_at: string
  } | null
  organizationName: string | null
  organizations: Array<{ id: string; name: string }>
  singles: Array<{ id: string; first_name: string; last_name: string; status: string; gender: string }>
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs font-medium text-[#888888] uppercase tracking-wide">{label}</p>
      <p className="text-sm text-[#1A1A1A] mt-0.5">{value || '—'}</p>
    </div>
  )
}

export default function AdminShadchanDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ShadchanData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', organization_id: '', is_approved: false,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/shadchanim/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then((d: ShadchanData | null) => {
        setData(d)
        if (d?.profile) {
          setForm({
            full_name: d.profile.full_name ?? '',
            email: d.profile.email ?? d.userRow.email ?? '',
            phone: d.profile.phone ?? d.userRow.phone ?? '',
            organization_id: d.profile.organization_id ?? '',
            is_approved: d.profile.is_approved,
          })
        }
        setLoading(false)
      })
  }, [id])

  function startEdit() {
    if (!data?.profile) return
    setForm({
      full_name: data.profile.full_name ?? '',
      email: data.profile.email ?? data.userRow.email ?? '',
      phone: data.profile.phone ?? data.userRow.phone ?? '',
      organization_id: data.profile.organization_id ?? '',
      is_approved: data.profile.is_approved,
    })
    setIsEditing(true)
  }

  async function handleSave() {
    if (!data?.profile) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/shadchanim/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: form.full_name,
          email: form.email,
          phone: form.phone,
          organization_id: form.organization_id || null,
          is_approved: form.is_approved,
        }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        toast.error((json as { error?: string }).error ?? 'Failed to save changes.')
        return
      }
      setData(prev => prev && prev.profile ? {
        ...prev,
        profile: {
          ...prev.profile,
          full_name: form.full_name,
          email: form.email || null,
          phone: form.phone || null,
          organization_id: form.organization_id || null,
          is_approved: form.is_approved,
        },
        organizationName: data.organizations.find(o => o.id === form.organization_id)?.name ?? prev.organizationName,
        userRow: { ...prev.userRow, email: form.email || prev.userRow.email },
      } : prev)
      setIsEditing(false)
      toast.success('Shadchan profile updated.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!data) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/shadchanim/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        toast.error((json as { error?: string }).error ?? 'Failed to delete.')
        return
      }
      toast.success('Shadchan profile deleted.')
      router.push('/admin/shadchanim')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <AppLayout navItems={navItems} title="Shadchan Details" role="platform_admin">
        <div className="flex items-center justify-center py-24 text-[#888888] text-sm">Loading…</div>
      </AppLayout>
    )
  }

  if (!data) {
    return (
      <AppLayout navItems={navItems} title="Shadchan Details" role="platform_admin">
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <p className="text-[#555555]">Shadchan not found.</p>
          <Link href="/admin/shadchanim"><Button variant="secondary">← Back to Shadchanim</Button></Link>
        </div>
      </AppLayout>
    )
  }

  const { userRow, profile, organizationName, singles } = data
  const displayName = profile?.full_name || userRow.email || 'Unknown Shadchan'
  const displayEmail = profile?.email ?? userRow.email
  const displayPhone = profile?.phone ?? userRow.phone
  const dateJoined = new Date(profile?.created_at ?? userRow.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <AppLayout navItems={navItems} title={displayName} role="platform_admin">
      <div className="max-w-4xl mx-auto space-y-5">

        <div>
          <button
            onClick={() => router.push('/admin/shadchanim')}
            className="inline-flex items-center gap-1.5 text-sm text-[#555555] hover:text-brand-maroon transition-colors mb-4"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Shadchanim
          </button>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-brand-maroon/10 flex items-center justify-center flex-shrink-0">
                <User className="h-6 w-6 text-brand-maroon" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-[#1A1A1A]">{displayName}</h1>
                <div className="flex items-center gap-2 mt-1.5">
                  <StatusBadge status={userRow.status} />
                  {profile?.is_approved && (
                    <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">Approved</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {!isEditing && profile && (
                <Button variant="secondary" size="sm" className="gap-1.5" onClick={startEdit}>
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
              )}
              {profile && (
                <Button variant="danger" size="sm" className="gap-1.5" onClick={() => setDeleteOpen(true)}>
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="card">
          <h2 className="text-base font-semibold text-[#1A1A1A] mb-4 flex items-center gap-2">
            <User className="h-4 w-4 text-brand-maroon" /> Profile Info
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
                  <Label className="field-label">Organization</Label>
                  <select
                    className="input-base mt-1 w-full"
                    value={form.organization_id}
                    onChange={e => setForm(f => ({ ...f, organization_id: e.target.value }))}
                  >
                    <option value="">— None —</option>
                    {data.organizations.map(o => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="is_approved"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-brand-maroon"
                  checked={form.is_approved}
                  onChange={e => setForm(f => ({ ...f, is_approved: e.target.checked }))}
                />
                <Label htmlFor="is_approved" className="text-sm cursor-pointer">Approved</Label>
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
                <Field label="Full Name" value={displayName} />
                <Field label="City" value={[profile?.city, profile?.state].filter(Boolean).join(', ') || null} />
                <Field label="Organization" value={organizationName} />
                <Field label="Approval Status" value={profile?.is_approved ? 'Approved' : 'Pending'} />
                <Field label="Date Joined" value={dateJoined} />
                <Field label="Singles Managed" value={String(singles.length)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-sm text-[#555555]">
                  <Mail className="h-4 w-4 text-[#888888] flex-shrink-0" />
                  {displayEmail ? <a href={`mailto:${displayEmail}`} className="hover:underline">{displayEmail}</a> : '—'}
                </div>
                <div className="flex items-center gap-2 text-sm text-[#555555]">
                  <Phone className="h-4 w-4 text-[#888888] flex-shrink-0" />
                  {displayPhone ? <a href={`tel:${displayPhone}`} className="hover:underline">{displayPhone}</a> : '—'}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Singles Managed */}
        <div className="card">
          <h2 className="text-base font-semibold text-[#1A1A1A] mb-4 flex items-center gap-2">
            <UsersRound className="h-4 w-4 text-brand-maroon" />
            Singles Managed
            <span className="ml-1 text-xs font-normal text-[#888888]">({singles.length})</span>
          </h2>
          {singles.length === 0 ? (
            <p className="text-sm text-[#888888]">No singles assigned to this shadchan.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="table-th">Name</th>
                    <th className="table-th">Gender</th>
                    <th className="table-th">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {singles.map(s => (
                    <tr
                      key={s.id}
                      className="table-row cursor-pointer hover:bg-gray-50"
                      onClick={() => router.push(`/admin/singles/${s.id}`)}
                    >
                      <td className="table-td font-medium text-brand-maroon hover:underline">
                        {s.first_name} {s.last_name}
                      </td>
                      <td className="table-td text-[#555555] capitalize">{s.gender}</td>
                      <td className="table-td"><StatusBadge status={s.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onOpenChange={o => { if (!o) setDeleteOpen(false) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Shadchan Profile</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-2">
            <p className="text-sm text-[#555555]">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-[#1A1A1A]">{displayName}</span>?
              This will remove their shadchan profile. Any singles they manage will become unassigned.
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

    </AppLayout>
  )
}
