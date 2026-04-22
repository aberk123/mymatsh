'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Pencil,
  Building2,
  Mail,
  MapPin,
  User,
  Users,
  Calendar,
  ShieldCheck,
  ShieldOff,
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { navItems } from '../_nav'

interface OrgDetail {
  id: string
  name: string
  email: string | null
  city: string | null
  primary_contact_name: string | null
  is_approved: boolean
  created_at: string
  memberCount: number
}

export default function OrganizationViewPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [org, setOrg] = useState<OrgDetail | null>(null)

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/admin/organizations/${id}`)
      if (res.ok) {
        const data = await res.json() as OrgDetail
        setOrg(data)
      }
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) {
    return (
      <AppLayout navItems={navItems} title="Organization" role="platform_admin">
        <div className="flex items-center justify-center py-24 text-[#888888] text-sm">Loading…</div>
      </AppLayout>
    )
  }

  if (!org) {
    return (
      <AppLayout navItems={navItems} title="Organization Not Found" role="platform_admin">
        <div className="card flex flex-col items-center justify-center py-16 text-center gap-4">
          <Building2 className="h-12 w-12 text-gray-300" />
          <p className="text-[#555555]">No organization found with this ID.</p>
          <Button variant="secondary" onClick={() => router.push('/admin/organizations')}>
            Back to Organizations
          </Button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout navItems={navItems} title={org.name} role="platform_admin">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.push('/admin/organizations')}
          className="flex items-center gap-1.5 text-sm text-[#555555] hover:text-[#1A1A1A] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Organizations
        </button>
        <Button
          className="gap-2"
          onClick={() => router.push(`/admin/organizations/${id}/edit`)}
        >
          <Pencil className="h-4 w-4" />
          Edit Organization
        </Button>
      </div>

      <div className="card space-y-0 divide-y divide-gray-100">
        <div className="flex items-start justify-between pb-5">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-[#F8F0F5] flex items-center justify-center">
              <Building2 className="h-6 w-6 text-brand-maroon" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#1A1A1A]">{org.name}</h2>
              <p className="text-sm text-[#888888]">ID: {org.id}</p>
            </div>
          </div>
          <StatusBadge status={org.is_approved ? 'active' : 'pending'} />
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 py-5">
          <div className="flex items-start gap-3">
            <Mail className="h-4 w-4 text-[#888888] mt-0.5 shrink-0" />
            <div>
              <dt className="text-xs text-[#888888] uppercase tracking-wide font-medium">Email</dt>
              <dd className="text-sm text-[#1A1A1A] mt-0.5">{org.email ?? '—'}</dd>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="h-4 w-4 text-[#888888] mt-0.5 shrink-0" />
            <div>
              <dt className="text-xs text-[#888888] uppercase tracking-wide font-medium">City</dt>
              <dd className="text-sm text-[#1A1A1A] mt-0.5">{org.city ?? '—'}</dd>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <User className="h-4 w-4 text-[#888888] mt-0.5 shrink-0" />
            <div>
              <dt className="text-xs text-[#888888] uppercase tracking-wide font-medium">Primary Contact</dt>
              <dd className="text-sm text-[#1A1A1A] mt-0.5">{org.primary_contact_name ?? '—'}</dd>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Users className="h-4 w-4 text-[#888888] mt-0.5 shrink-0" />
            <div>
              <dt className="text-xs text-[#888888] uppercase tracking-wide font-medium">Members</dt>
              <dd className="text-sm text-[#1A1A1A] mt-0.5">{org.memberCount}</dd>
            </div>
          </div>

          <div className="flex items-start gap-3">
            {org.is_approved
              ? <ShieldCheck className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              : <ShieldOff className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
            }
            <div>
              <dt className="text-xs text-[#888888] uppercase tracking-wide font-medium">Approval Status</dt>
              <dd className="text-sm text-[#1A1A1A] mt-0.5">{org.is_approved ? 'Approved' : 'Pending Approval'}</dd>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="h-4 w-4 text-[#888888] mt-0.5 shrink-0" />
            <div>
              <dt className="text-xs text-[#888888] uppercase tracking-wide font-medium">Created</dt>
              <dd className="text-sm text-[#1A1A1A] mt-0.5">
                {new Date(org.created_at).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                })}
              </dd>
            </div>
          </div>
        </dl>
      </div>
    </AppLayout>
  )
}
