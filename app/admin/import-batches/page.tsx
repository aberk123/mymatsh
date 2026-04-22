'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Building2,
  Heart,
  Newspaper,
  DollarSign,
  ClipboardList,
  Eye,
  PackageOpen,
  UsersRound,
  Home,
  BookOpen,
  MessageSquare,
  Upload,
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { Button } from '@/components/ui/button'
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

interface BatchRow {
  id: string
  shadchan_name: string
  status: string
  shadchan_comments: string | null
  created_at: string
  updated_at: string
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  pending_review: { label: 'Pending Review', cls: 'bg-yellow-100 text-yellow-700' },
  shadchan_approved: { label: 'Shadchan Approved', cls: 'bg-blue-100 text-blue-700' },
  admin_approved: { label: 'Imported', cls: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejected', cls: 'bg-red-100 text-red-700' },
}

export default function ImportBatchesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [batches, setBatches] = useState<BatchRow[]>([])

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/admin/import-batches')
      if (res.ok) setBatches(await res.json() as BatchRow[])
      setLoading(false)
    }
    load()
  }, [])

  const pendingApproval = batches.filter(b => b.status === 'shadchan_approved').length

  return (
    <AppLayout
      navItems={navItems.map(n =>
        n.href === '/admin/import-batches' && pendingApproval > 0
          ? { ...n, badge: String(pendingApproval) }
          : n
      )}
      title="Import Batches"
      role="platform_admin"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-[#1A1A1A]">Import Batches</h2>
          {pendingApproval > 0 && (
            <p className="text-sm text-blue-600 mt-0.5">
              {pendingApproval} batch{pendingApproval !== 1 ? 'es' : ''} awaiting your final approval
            </p>
          )}
        </div>
        <Button
          className="btn-primary gap-2"
          onClick={() => router.push('/admin/import-upload')}
        >
          <Upload className="h-4 w-4" />
          New Import
        </Button>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-[#888888] text-sm">Loading…</div>
        ) : batches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <PackageOpen className="h-12 w-12 text-gray-200" />
            <p className="text-sm text-[#888888]">No import batches yet.</p>
            <Button className="btn-primary" onClick={() => router.push('/admin/import-upload')}>
              Import from Evernote
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="table-th">Created</th>
                  <th className="table-th">Shadchan</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Shadchan Notes</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {batches.filter(b => b.status !== 'rejected').map(batch => {
                  const st = STATUS_LABELS[batch.status] ?? { label: batch.status, cls: 'bg-gray-100 text-gray-600' }
                  return (
                    <tr key={batch.id} className="table-row">
                      <td className="table-td text-[#555555]">
                        {new Date(batch.created_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </td>
                      <td className="table-td font-medium text-[#1A1A1A]">{batch.shadchan_name}</td>
                      <td className="table-td">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${st.cls}`}>
                          {st.label}
                        </span>
                        {batch.status === 'shadchan_approved' && (
                          <span className="ml-2 inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        )}
                      </td>
                      <td className="table-td text-[#555555] text-xs max-w-xs truncate">
                        {batch.shadchan_comments ?? '—'}
                      </td>
                      <td className="table-td">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1"
                          onClick={() => router.push(`/admin/import-batches/${batch.id}`)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Review
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
