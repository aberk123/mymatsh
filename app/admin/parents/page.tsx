'use client'

import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Building2,
  Heart,
  Newspaper,
  DollarSign,
  ClipboardList,
  Search,
  UsersRound,
  Home,
  BookOpen,
  MessageSquare,
  PackageOpen,
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { StatusBadge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import type { NavItem } from '@/components/ui/sidebar'
import { createClient } from '@/lib/supabase/client'

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

interface ParentRow {
  id: string
  fullName: string
  city: string
  email: string | null
  phone: string | null
  childName: string
  childStatus: string
}

export default function AdminParentsPage() {
  const [loading, setLoading] = useState(true)
  const [parents, setParents] = useState<ParentRow[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: rows } = await (supabase.from('parents') as any)
        .select('id, full_name, city, email, phone, child_id')
        .order('created_at', { ascending: false }) as {
          data: Array<{
            id: string
            full_name: string
            city: string | null
            email: string | null
            phone: string | null
            child_id: string
          }> | null
        }

      if (!rows || rows.length === 0) { setLoading(false); return }

      const childIds = Array.from(new Set(rows.map((r) => r.child_id)))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: singles } = await (supabase.from('singles') as any)
        .select('id, first_name, last_name, status')
        .in('id', childIds) as {
          data: Array<{ id: string; first_name: string; last_name: string; status: string }> | null
        }

      const singleMap = Object.fromEntries(
        (singles ?? []).map((s) => [s.id, { name: `${s.first_name} ${s.last_name}`.trim(), status: s.status }])
      )

      setParents(rows.map((r) => ({
        id: r.id,
        fullName: r.full_name,
        city: r.city ?? '',
        email: r.email,
        phone: r.phone,
        childName: singleMap[r.child_id]?.name ?? '—',
        childStatus: singleMap[r.child_id]?.status ?? '—',
      })))

      setLoading(false)
    }

    load()
  }, [])

  const filtered = parents.filter(
    (p) =>
      p.fullName.toLowerCase().includes(search.toLowerCase()) ||
      p.childName.toLowerCase().includes(search.toLowerCase()) ||
      p.city.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AppLayout navItems={navItems} title="Parents" role="platform_admin">
      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-[#888888] text-sm">Loading…</div>
        ) : (
          <>
            <div className="relative mb-4 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#888888]" />
              <Input
                placeholder="Search parents or child name..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="table-th">Parent Name</th>
                    <th className="table-th">City</th>
                    <th className="table-th">Email</th>
                    <th className="table-th">Phone</th>
                    <th className="table-th">Child</th>
                    <th className="table-th">Child Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id} className="table-row">
                      <td className="table-td font-medium text-[#1A1A1A]">{p.fullName}</td>
                      <td className="table-td text-[#555555]">{p.city || '—'}</td>
                      <td className="table-td text-[#555555]">{p.email ?? '—'}</td>
                      <td className="table-td text-[#555555]">{p.phone ?? '—'}</td>
                      <td className="table-td text-[#555555]">{p.childName}</td>
                      <td className="table-td">
                        {p.childStatus === '—' ? (
                          <span className="text-[#888888]">—</span>
                        ) : (
                          <StatusBadge status={p.childStatus} />
                        )}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="table-td text-center text-[#888888] py-8">
                        {parents.length === 0 ? 'No parents found.' : 'No parents match your search.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}
