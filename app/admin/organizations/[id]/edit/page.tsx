'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { navItems } from '../../_nav'
import { mockOrgs } from '../../_data'

export default function OrganizationEditPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const org = mockOrgs.find((o) => o.id === id)

  const [form, setForm] = useState({
    name: org?.name ?? '',
    email: org?.email ?? '',
    city: org?.city ?? '',
    primaryContact: org?.primaryContact ?? '',
    approved: org?.approved ?? false,
  })
  const [saving, setSaving] = useState(false)

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

  async function handleSave() {
    setSaving(true)
    // TODO: replace with real API call to PATCH /api/admin/organizations/:id
    await new Promise((r) => setTimeout(r, 600))
    setSaving(false)
    toast.success('Organization updated')
    router.push(`/admin/organizations/${id}`)
  }

  return (
    <AppLayout navItems={navItems} title={`Edit — ${org.name}`} role="platform_admin">
      {/* Header */}
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
            value={form.primaryContact}
            onChange={(e) => setForm({ ...form, primaryContact: e.target.value })}
            placeholder="e.g. Rabbi Goldstein"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="edit-approved"
            type="checkbox"
            className="h-4 w-4 accent-brand-maroon"
            checked={form.approved}
            onChange={(e) => setForm({ ...form, approved: e.target.checked })}
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
            onClick={handleSave}
            loading={saving}
            loadingText="Saving…"
            disabled={!form.name.trim()}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </AppLayout>
  )
}
