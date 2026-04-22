'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Eye, Pencil } from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { mockOrgs as initialOrgs, type MockOrg } from './_data'
import { navItems } from './_nav'

interface OrgForm {
  name: string
  email: string
  city: string
  primary_contact_name: string
  is_approved: boolean
}

const emptyForm: OrgForm = { name: '', email: '', city: '', primary_contact_name: '', is_approved: false }

export default function AdminOrganizationsPage() {
  const router = useRouter()
  const [orgs, setOrgs] = useState<MockOrg[]>(initialOrgs)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<OrgForm>(emptyForm)

  const handleAdd = () => {
    setOrgs((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        name: form.name || 'Untitled Org',
        city: form.city || '—',
        email: form.email || '—',
        primaryContact: form.primary_contact_name || '—',
        members: 0,
        approved: form.is_approved,
        createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      },
    ])
    setForm(emptyForm)
    setDialogOpen(false)
  }

  return (
    <AppLayout navItems={navItems} title="Organizations" role="platform_admin">
      <div className="flex justify-end mb-4">
        <Button variant="primary" size="md" className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Organization
        </Button>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="table-th">Name</th>
                <th className="table-th">City</th>
                <th className="table-th">Email</th>
                <th className="table-th">Members</th>
                <th className="table-th">Status</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orgs.map((org) => (
                <tr key={org.id} className="table-row">
                  <td className="table-td font-medium text-[#1A1A1A]">{org.name}</td>
                  <td className="table-td text-[#555555]">{org.city}</td>
                  <td className="table-td text-[#555555]">{org.email}</td>
                  <td className="table-td text-[#555555]">{org.members}</td>
                  <td className="table-td">
                    <StatusBadge status={org.approved ? 'active' : 'pending'} />
                  </td>
                  <td className="table-td">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1"
                        onClick={() => router.push(`/admin/organizations/${org.id}`)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1"
                        onClick={() => router.push(`/admin/organizations/${org.id}/edit`)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Organization Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Organization</DialogTitle>
          </DialogHeader>
          <div className="px-6 py-2 space-y-4">
            <div>
              <Label className="field-label">Organization Name</Label>
              <Input
                placeholder="e.g. Yad L'Bachur"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <Label className="field-label">Email</Label>
              <Input
                type="email"
                placeholder="info@organization.org"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <Label className="field-label">City</Label>
              <Input
                placeholder="e.g. Lakewood, NJ"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
            <div>
              <Label className="field-label">Primary Contact Name</Label>
              <Input
                placeholder="e.g. Rabbi Goldstein"
                value={form.primary_contact_name}
                onChange={(e) => setForm({ ...form, primary_contact_name: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="is_approved"
                type="checkbox"
                className="h-4 w-4 accent-brand-maroon"
                checked={form.is_approved}
                onChange={(e) => setForm({ ...form, is_approved: e.target.checked })}
              />
              <Label htmlFor="is_approved" className="text-sm text-[#555555] cursor-pointer">
                Approve immediately
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" size="md" onClick={() => { setForm(emptyForm); setDialogOpen(false) }}>
              Cancel
            </Button>
            <Button variant="primary" size="md" onClick={handleAdd}>
              Add Organization
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
