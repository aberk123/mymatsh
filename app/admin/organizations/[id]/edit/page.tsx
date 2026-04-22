'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { navItems } from '../../_nav'

interface OrgDetail {
  id: string
  name: string
  email: string | null
  city: string | null
  primary_contact_name: string | null
  is_approved: boolean
  created_at: string
}

export default function OrganizationEditPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [org, setOrg] = useState<OrgDetail | null>(null)
  const [form, setForm] = useState({
    name: '',
    email: '',
    city: '',
    primary_contact_name: '',
    is_approved: false,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/admin/organizations/${id}`)
      if (res.ok) {
        const data = await res.json() as OrgDetail
        setOrg(data)
        setForm({
          name: data.name,
          email: data.email ?? '',
          city: data.city ?? '',
          primary_contact_name: data.primary_contact_name ?? '',
          is_approved: data.is_approved,
        })
      }
      setLoading(false)
    }
    load()
  }, [id])

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/organizations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Organization updated')
      router.push(`/admin/organizations/${id}`)
    } catch {
      toast.error('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AppLayout navItems={navItems} title="Edit Organization" role="platform_admin">
        <div className="flex items-center justify-center py-24 text-[#888888] text-sm">Loading…</div>
      </AppLayout>
    )
  }

  if (!org) {
    return (
      <AppLayout navItems={navItems} title="Organization Not Found" role="platform_admin">
        <div className="card flex flex-col items-center justify-center py-16 text-center gap-4">
          <p className="text-[#555555]">No organization found with this ID.</p>
          <Button variant="secondary" onClick={() => router.push('/admin/organizations')}>
            Back to Organizations
          </Button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout navItems={navItems} title={`Edit — ${org.name}`} role="platform_admin">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.push(`/admin/organizations/${id}`)}
          className="flex items-center gap-1.5 text-sm text-[#555555] hover:text-[#1A1A1A] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {org.name}
        </button>
      </div>

      <div className="card max-w-lg space-y-5">
        <div>
          <Label htmlFor="edit-name" required>Organization Name</Label>
          <Input
            id="edit-name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Organization name"
          />
        </div>

        <div>
          <Label htmlFor="edit-email">Email</Label>
          <Input
            id="edit-email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="info@organization.org"
          />
        </div>

        <div>
          <Label htmlFor="edit-city">City</Label>
          <Input
            id="edit-city"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            placeholder="e.g. Lakewood, NJ"
          />
        </div>

        <div>
          <Label htmlFor="edit-contact">Primary Contact Name</Label>
          <Input
            id="edit-contact"
            value={form.primary_contact_name}
            onChange={(e) => setForm({ ...form, primary_contact_name: e.target.value })}
            placeholder="e.g. Rabbi Goldstein"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="edit-approved"
            type="checkbox"
            className="h-4 w-4 accent-brand-maroon"
            checked={form.is_approved}
            onChange={(e) => setForm({ ...form, is_approved: e.target.checked })}
          />
          <Label htmlFor="edit-approved" className="text-sm text-[#555555] cursor-pointer">
            Approved
          </Label>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button
            variant="secondary"
            onClick={() => router.push(`/admin/organizations/${id}`)}
          >
            Cancel
          </Button>
          <Button
            loading={saving}
            loadingText="Saving…"
            disabled={!form.name.trim() || saving}
            onClick={handleSave}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </AppLayout>
  )
}
