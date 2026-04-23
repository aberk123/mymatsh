'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Building2,
  Heart,
  Newspaper,
  DollarSign,
  ClipboardList,
  PackageOpen,
  UsersRound,
  Home,
  BookOpen,
  MessageSquare,
  CheckCircle,
  XCircle,
  Link,
  AlertTriangle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { Button } from '@/components/ui/button'
import type { NavItem } from '@/components/ui/sidebar'
import { createClient } from '@/lib/supabase/client'
import { checkDuplicate, type ParsedSingle, type ExistingSingle } from '@/lib/utils/evernote-parser'
import type { ImportSummary } from '@/types/database'

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

interface BatchMeta {
  id: string
  status: string
  shadchan_name: string
  review_token: string
  shadchan_comments: string | null
  import_summary: ImportSummary | null
  created_at: string
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  pending_review: { label: 'Pending Review', cls: 'bg-yellow-100 text-yellow-700' },
  shadchan_approved: { label: 'Shadchan Approved', cls: 'bg-blue-100 text-blue-700' },
  admin_approved: { label: 'Imported', cls: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejected', cls: 'bg-red-100 text-red-700' },
}

function fmtHeight(inches: number | null): string {
  if (!inches) return ''
  return `${Math.floor(inches / 12)}'${inches % 12}"`
}

export default function ImportBatchDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [meta, setMeta] = useState<BatchMeta | null>(null)
  const [editedData, setEditedData] = useState<ParsedSingle[]>([])
  const [saving, setSaving] = useState(false)
  const [approving, setApproving] = useState(false)
  const [approveResult, setApproveResult] = useState<{ new_records: number; duplicates_skipped: number; existing_updated: number } | null>(null)
  const [rejecting, setRejecting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/admin/import-batches/${id}`)
      if (!res.ok) { setLoading(false); return }
      const batch = await res.json() as BatchMeta & { parsed_data: ParsedSingle[]; import_summary: ImportSummary | null }

      setMeta({
        id: batch.id,
        status: batch.status,
        shadchan_name: batch.shadchan_name,
        review_token: batch.review_token,
        shadchan_comments: batch.shadchan_comments,
        import_summary: (batch.import_summary as ImportSummary | null) ?? null,
        created_at: batch.created_at,
      })

      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existing } = await (supabase.from('singles') as any)
        .select('id, first_name, last_name, age, dob') as { data: ExistingSingle[] | null }

      const existingSingles = existing ?? []
      const withDupCheck = (batch.parsed_data ?? []).map(record => {
        const dup = checkDuplicate(record, existingSingles)
        return { ...record, _is_duplicate: dup.isDuplicate, _duplicate_match: dup.matchName }
      })

      setEditedData(withDupCheck)
      setLoading(false)
    }
    load()
  }, [id])

  const updateRecord = useCallback((realIdx: number, patch: Partial<ParsedSingle>) => {
    setEditedData(prev => prev.map((r, i) => i === realIdx ? { ...r, ...patch } : r))
  }, [])

  async function handleSave() {
    if (!meta) return
    setSaving(true)
    await fetch(`/api/admin/import-batches/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parsed_data: editedData }),
    })
    setSaving(false)
  }

  function handleCopyLink() {
    if (!meta) return
    const link = `${window.location.origin}/review/${meta.review_token}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  async function handleApprove() {
    if (!meta) return
    setApproving(true)
    await fetch(`/api/admin/import-batches/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parsed_data: editedData }),
    })
    const res = await fetch(`/api/admin/import-batches/${id}/approve`, { method: 'POST' })
    if (res.ok) {
      const result = await res.json() as { new_records: number; duplicates_skipped: number; existing_updated: number }
      setApproveResult(result)
      // Reload to get import_summary
      const refreshed = await fetch(`/api/admin/import-batches/${id}`)
      if (refreshed.ok) {
        const refreshedBatch = await refreshed.json() as BatchMeta & { import_summary: ImportSummary | null }
        setMeta(prev => prev ? { ...prev, status: 'admin_approved', import_summary: refreshedBatch.import_summary } : prev)
      } else {
        setMeta(prev => prev ? { ...prev, status: 'admin_approved' } : prev)
      }
    }
    setApproving(false)
  }

  async function handleReject() {
    if (!meta) return
    if (!confirm('Reject this batch? This cannot be undone.')) return
    setRejecting(true)
    const res = await fetch(`/api/admin/import-batches/${id}/reject`, { method: 'POST' })
    if (res.ok) router.push('/admin/import-batches')
    else setRejecting(false)
  }

  const goodRecords = editedData.filter(r => !r._parse_error)
  const errorRecords = editedData.filter(r => r._parse_error)
  const skipCount = goodRecords.filter(r => r._skip).length
  const dupCount = goodRecords.filter(r => r._is_duplicate && !r._skip).length
  const isFinalized = meta?.status === 'admin_approved' || meta?.status === 'rejected'
  const st = meta ? (STATUS_LABELS[meta.status] ?? { label: meta.status, cls: 'bg-gray-100 text-gray-600' }) : null

  if (loading) {
    return (
      <AppLayout navItems={navItems} title="Import Batch Review" role="platform_admin">
        <div className="flex items-center justify-center py-24 text-[#888888] text-sm">Loading…</div>
      </AppLayout>
    )
  }

  if (!meta) {
    return (
      <AppLayout navItems={navItems} title="Import Batch Review" role="platform_admin">
        <div className="text-center py-16 text-[#888888]">Batch not found.</div>
      </AppLayout>
    )
  }

  return (
    <AppLayout navItems={navItems} title="Import Batch Review" role="platform_admin">
      {/* Header */}
      <div className="flex items-start justify-between mb-4 gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-semibold text-[#1A1A1A]">Import Batch Review</h2>
            {st && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${st.cls}`}>
                {st.label}
              </span>
            )}
          </div>
          <p className="text-sm text-[#555555] mt-0.5">
            Shadchan: <span className="font-medium">{meta.shadchan_name}</span>
            {' · '}
            {new Date(meta.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            {' · '}
            <span className="font-medium">{goodRecords.length}</span> record{goodRecords.length !== 1 ? 's' : ''}
            {skipCount > 0 && <span className="text-[#888888]"> ({skipCount} skipped)</span>}
            {dupCount > 0 && (
              <span className="ml-2 text-orange-600 inline-flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                {dupCount} possible duplicate{dupCount !== 1 ? 's' : ''}
              </span>
            )}
          </p>
          {meta.shadchan_comments && (
            <p className="text-sm text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg mt-2">
              Shadchan notes: {meta.shadchan_comments}
            </p>
          )}
        </div>

        {!isFinalized && (
          <div className="flex gap-2 flex-wrap flex-shrink-0">
            <Button variant="ghost" size="sm" onClick={handleCopyLink} className="gap-1.5">
              <Link className="h-3.5 w-3.5" />
              {copied ? 'Copied!' : 'Copy Review Link'}
            </Button>
            <Button variant="secondary" size="sm" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
            <Button
              className="btn-primary gap-1.5"
              size="sm"
              onClick={handleApprove}
              disabled={approving}
            >
              <CheckCircle className="h-3.5 w-3.5" />
              {approving ? 'Importing…' : `Approve & Import (${goodRecords.filter(r => !r._skip).length})`}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-1.5"
              onClick={handleReject}
              disabled={rejecting}
            >
              <XCircle className="h-3.5 w-3.5" />
              Reject Batch
            </Button>
          </div>
        )}
      </div>

      {approveResult && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          <span>
            <span className="font-medium">{approveResult.new_records} new</span>
            {approveResult.existing_updated > 0 && (
              <span className="ml-2 text-blue-600">· {approveResult.existing_updated} updated</span>
            )}
            {approveResult.duplicates_skipped > 0 && (
              <span className="ml-2 text-orange-600">· {approveResult.duplicates_skipped} skipped</span>
            )}
          </span>
        </div>
      )}

      {/* Import Summary Report */}
      {meta.status === 'admin_approved' && meta.import_summary && (
        <div className="mb-6 space-y-4">
          <h3 className="text-sm font-semibold text-[#1A1A1A]">Import Report</h3>

          {/* New Records */}
          {meta.import_summary.new_records.length > 0 && (
            <div className="card p-0 overflow-hidden">
              <div className="px-4 py-2.5 bg-green-50 border-b border-green-100">
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                  New Records ({meta.import_summary.new_records.length})
                </p>
              </div>
              <div className="divide-y divide-gray-100">
                {meta.import_summary.new_records.map(r => (
                  <div key={r.single_id} className="px-4 py-2.5 flex items-center justify-between">
                    <span className="text-sm font-medium text-[#1A1A1A]">{r.name}</span>
                    <span className="text-xs text-[#888888]">
                      {r.gender && <span className="capitalize">{r.gender}</span>}
                      {(r.city || r.state) && <span> · {[r.city, r.state].filter(Boolean).join(', ')}</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Existing Updated */}
          {meta.import_summary.existing_updated.length > 0 && (
            <div className="card p-0 overflow-hidden">
              <div className="px-4 py-2.5 bg-blue-50 border-b border-blue-100">
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                  Existing Records Updated ({meta.import_summary.existing_updated.length})
                </p>
              </div>
              <div className="divide-y divide-gray-100">
                {meta.import_summary.existing_updated.map(r => (
                  <div key={r.single_id} className="px-4 py-3">
                    <p className="text-sm font-medium text-[#1A1A1A] mb-1">{r.name}</p>
                    {r.fields_added.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-1">
                        <span className="text-[10px] text-green-600 font-medium">Added:</span>
                        {r.fields_added.map(f => (
                          <span key={f} className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full">{f}</span>
                        ))}
                      </div>
                    )}
                    {r.fields_skipped.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        <span className="text-[10px] text-[#888888] font-medium">Already had:</span>
                        {r.fields_skipped.map(f => (
                          <span key={f} className="text-[10px] bg-gray-100 text-[#888888] px-1.5 py-0.5 rounded-full">{f}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Duplicates Skipped */}
          {meta.import_summary.duplicates_skipped.length > 0 && (
            <div className="card p-0 overflow-hidden">
              <div className="px-4 py-2.5 bg-orange-50 border-b border-orange-100">
                <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide">
                  Skipped — Possible Duplicates ({meta.import_summary.duplicates_skipped.length})
                </p>
              </div>
              <div className="divide-y divide-gray-100">
                {meta.import_summary.duplicates_skipped.map(r => (
                  <div key={r.existing_single_id} className="px-4 py-2.5 flex items-start gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-[#1A1A1A]">{r.name}</p>
                      <p className="text-xs text-[#888888] mt-0.5">
                        {r.reason} — matched: <span className="text-orange-700">{r.existing_single_name}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Spreadsheet table */}
      {goodRecords.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="text-xs w-full min-w-[1500px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-2 py-2 text-left font-medium text-[#555555] w-10">Skip</th>
                  <th className="px-2 py-2 text-left font-medium text-[#555555] w-16">Photo</th>
                  <th className="px-2 py-2 text-left font-medium text-[#555555] w-32">First Name</th>
                  <th className="px-2 py-2 text-left font-medium text-[#555555] w-32">Last Name</th>
                  <th className="px-2 py-2 text-left font-medium text-[#555555] w-20">Gender</th>
                  <th className="px-2 py-2 text-left font-medium text-[#555555] w-14">Age</th>
                  <th className="px-2 py-2 text-left font-medium text-[#555555] w-28">Phone</th>
                  <th className="px-2 py-2 text-left font-medium text-[#555555] w-28">City/State</th>
                  <th className="px-2 py-2 text-left font-medium text-[#555555] w-14">Ht</th>
                  <th className="px-2 py-2 text-left font-medium text-[#555555] w-44">Yeshiva / Seminary</th>
                  <th className="px-2 py-2 text-left font-medium text-[#555555] w-36">Plans</th>
                  <th className="px-2 py-2 text-left font-medium text-[#555555] w-28">EY</th>
                  <th className="px-2 py-2 text-left font-medium text-[#555555] w-40">Raw Notes</th>
                  <th className="px-2 py-2 text-left font-medium text-[#555555] w-28">Flags</th>
                </tr>
              </thead>
              <tbody>
                {goodRecords.map((record) => {
                  const realIdx = editedData.indexOf(record)
                  const notesExpanded = expandedNotes.has(record._id)
                  return (
                    <tr
                      key={record._id}
                      className={[
                        'border-b border-gray-100',
                        record._skip ? 'opacity-40' : '',
                        record.parse_method === 'failed' && !record._skip ? 'bg-red-50' : '',
                        record.parse_method !== 'failed' && record.parse_confidence === 'low' && !record._skip ? 'bg-yellow-50/60' : '',
                        record._is_duplicate && !record._skip && record.parse_method !== 'failed' && record.parse_confidence !== 'low' ? 'bg-orange-50/40' : '',
                      ].join(' ')}
                    >
                      {/* Skip */}
                      <td className="px-2 py-1.5 text-center">
                        <input
                          type="checkbox"
                          checked={record._skip}
                          onChange={e => updateRecord(realIdx, { _skip: e.target.checked })}
                          className="rounded border-gray-300"
                          disabled={isFinalized}
                        />
                      </td>

                      {/* Photo */}
                      <td className="px-2 py-1.5">
                        {record.photo_url ? (
                          <img src={record.photo_url} alt="" className="w-10 h-10 rounded object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-[#cccccc] text-[10px]">—</div>
                        )}
                      </td>

                      {/* First Name */}
                      <td className="px-1 py-1">
                        <input
                          type="text"
                          value={record.first_name}
                          onChange={e => updateRecord(realIdx, { first_name: e.target.value })}
                          className="w-full px-1.5 py-0.5 border border-gray-200 rounded text-xs focus:outline-none focus:border-brand-maroon"
                          disabled={isFinalized}
                        />
                      </td>

                      {/* Last Name */}
                      <td className="px-1 py-1">
                        <input
                          type="text"
                          value={record.last_name}
                          onChange={e => updateRecord(realIdx, { last_name: e.target.value })}
                          className="w-full px-1.5 py-0.5 border border-gray-200 rounded text-xs focus:outline-none focus:border-brand-maroon"
                          disabled={isFinalized}
                        />
                      </td>

                      {/* Gender */}
                      <td className="px-1 py-1">
                        <select
                          value={record.gender ?? ''}
                          onChange={e => updateRecord(realIdx, { gender: (e.target.value || null) as 'male' | 'female' | null })}
                          className="w-full px-1 py-0.5 border border-gray-200 rounded text-xs bg-white focus:outline-none focus:border-brand-maroon"
                          disabled={isFinalized}
                        >
                          <option value="">—</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </select>
                      </td>

                      {/* Age */}
                      <td className="px-1 py-1">
                        <input
                          type="number"
                          value={record.age ?? ''}
                          onChange={e => updateRecord(realIdx, { age: e.target.value ? parseInt(e.target.value, 10) : null })}
                          className="w-full px-1.5 py-0.5 border border-gray-200 rounded text-xs focus:outline-none focus:border-brand-maroon"
                          min={16} max={99}
                          disabled={isFinalized}
                        />
                      </td>

                      {/* Phone */}
                      <td className="px-1 py-1">
                        <input
                          type="text"
                          value={record.phone ?? ''}
                          onChange={e => updateRecord(realIdx, { phone: e.target.value || null })}
                          className="w-full px-1.5 py-0.5 border border-gray-200 rounded text-xs focus:outline-none focus:border-brand-maroon"
                          disabled={isFinalized}
                        />
                      </td>

                      {/* City/State */}
                      <td className="px-1 py-1">
                        <input
                          type="text"
                          value={[record.city, record.state].filter(Boolean).join(', ')}
                          onChange={e => {
                            const parts = e.target.value.split(',').map(s => s.trim())
                            updateRecord(realIdx, {
                              city: parts[0] || null,
                              state: parts[1] || null,
                            })
                          }}
                          className="w-full px-1.5 py-0.5 border border-gray-200 rounded text-xs focus:outline-none focus:border-brand-maroon"
                          disabled={isFinalized}
                        />
                      </td>

                      {/* Height */}
                      <td className="px-2 py-1.5 text-[#555555] whitespace-nowrap">
                        {fmtHeight(record.height_inches)}
                      </td>

                      {/* Yeshiva */}
                      <td className="px-1 py-1">
                        <input
                          type="text"
                          value={record.current_yeshiva_seminary ?? ''}
                          onChange={e => updateRecord(realIdx, { current_yeshiva_seminary: e.target.value || null })}
                          className="w-full px-1.5 py-0.5 border border-gray-200 rounded text-xs focus:outline-none focus:border-brand-maroon"
                          disabled={isFinalized}
                        />
                      </td>

                      {/* Plans */}
                      <td className="px-1 py-1">
                        <input
                          type="text"
                          value={record.plans ?? ''}
                          onChange={e => updateRecord(realIdx, { plans: e.target.value || null })}
                          className="w-full px-1.5 py-0.5 border border-gray-200 rounded text-xs focus:outline-none focus:border-brand-maroon"
                          disabled={isFinalized}
                        />
                      </td>

                      {/* EY */}
                      <td className="px-1 py-1">
                        <input
                          type="text"
                          value={record.eretz_yisroel ?? ''}
                          onChange={e => updateRecord(realIdx, { eretz_yisroel: e.target.value || null })}
                          className="w-full px-1.5 py-0.5 border border-gray-200 rounded text-xs focus:outline-none focus:border-brand-maroon"
                          disabled={isFinalized}
                        />
                      </td>

                      {/* Raw Notes */}
                      <td className="px-2 py-1.5">
                        {record.raw_notes.length > 0 ? (
                          <div>
                            <button
                              className="flex items-center gap-1 text-[10px] text-[#888888] hover:text-[#555555]"
                              onClick={() =>
                                setExpandedNotes(prev => {
                                  const next = new Set(prev)
                                  if (next.has(record._id)) next.delete(record._id)
                                  else next.add(record._id)
                                  return next
                                })
                              }
                            >
                              {notesExpanded
                                ? <ChevronDown className="h-3 w-3" />
                                : <ChevronRight className="h-3 w-3" />}
                              {record.raw_notes.length} line{record.raw_notes.length !== 1 ? 's' : ''}
                            </button>
                            {notesExpanded && (
                              <ul className="mt-1 space-y-0.5 max-w-xs">
                                {record.raw_notes.map((note, ni) => (
                                  <li key={ni} className="text-[10px] text-[#888888] break-words">{note}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>

                      {/* Flags */}
                      <td className="px-2 py-1.5">
                        <div className="flex flex-col gap-1">
                          {record.parse_method === 'failed' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-red-700 bg-red-100 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                              <AlertCircle className="h-3 w-3" />
                              AI failed
                            </span>
                          )}
                          {record.parse_method === 'ai' && record.parse_confidence === 'low' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-yellow-700 bg-yellow-100 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                              <AlertTriangle className="h-3 w-3" />
                              Low confidence
                            </span>
                          )}
                          {record.parse_method === 'ai' && record.parse_confidence && record.parse_confidence !== 'low' && (
                            <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                              AI · {record.parse_confidence}
                            </span>
                          )}
                          {record._is_duplicate && !record._skip && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                              <AlertTriangle className="h-3 w-3" />
                              {record._duplicate_match ?? 'Dup'}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Parse-error records */}
      {errorRecords.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-red-600 mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {errorRecords.length} record{errorRecords.length !== 1 ? 's' : ''} with parse errors — skipped on import
          </h3>
          <div className="card p-0 divide-y divide-gray-100">
            {errorRecords.map(record => (
              <div key={record._id} className="px-4 py-3 flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-[#1A1A1A]">
                    {record.first_name || record.last_name
                      ? `${record.first_name} ${record.last_name}`.trim()
                      : record._source_file}
                  </p>
                  <p className="text-xs text-red-500 mt-0.5">{record._parse_error}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom actions */}
      {!isFinalized && goodRecords.length > 0 && (
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
          <Button className="btn-primary gap-2" onClick={handleApprove} disabled={approving}>
            <CheckCircle className="h-4 w-4" />
            {approving ? 'Importing…' : `Approve & Import (${goodRecords.filter(r => !r._skip).length})`}
          </Button>
        </div>
      )}
    </AppLayout>
  )
}
