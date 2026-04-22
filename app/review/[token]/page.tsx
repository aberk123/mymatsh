'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ParsedSingle } from '@/lib/utils/evernote-parser'

interface BatchData {
  id: string
  status: string
  shadchan_name: string
  shadchan_comments: string | null
  created_at: string
  parsed_data: ParsedSingle[]
}

function fmtHeight(inches: number | null): string {
  if (!inches) return '—'
  return `${Math.floor(inches / 12)}'${inches % 12}"`
}

export default function ReviewPage() {
  const { token } = useParams<{ token: string }>()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [batch, setBatch] = useState<BatchData | null>(null)
  const [comments, setComments] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/review/${token}`)
      if (!res.ok) {
        const body = await res.json() as { error: string }
        setError(body.error ?? 'This review link is invalid or has expired.')
      } else {
        const data = await res.json() as BatchData
        setBatch(data)
        if (data.status === 'shadchan_approved' || data.status === 'admin_approved') {
          setSubmitted(true)
        }
      }
      setLoading(false)
    }
    load()
  }, [token])

  async function handleApprove() {
    setSubmitting(true)
    const res = await fetch(`/api/review/${token}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comments: comments.trim() || undefined }),
    })
    if (res.ok) {
      setSubmitted(true)
    } else {
      const body = await res.json() as { error: string }
      setError(body.error ?? 'Something went wrong. Please try again.')
    }
    setSubmitting(false)
  }

  const singles = (batch?.parsed_data ?? []).filter(r => !r._parse_error && !r._skip)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F6F1] flex items-center justify-center">
        <p className="text-[#888888] text-sm">Loading…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8F6F1] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm p-8 text-center">
          <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
          <h1 className="text-lg font-semibold text-[#1A1A1A] mb-2">Review Link Invalid</h1>
          <p className="text-sm text-[#555555]">{error}</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F8F6F1] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm p-8 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-[#1A1A1A] mb-2">Review Submitted</h1>
          <p className="text-sm text-[#555555]">
            Thank you! The admin has been notified and will complete the import.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F6F1]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[#1A1A1A]">Shidduch Import Review</h1>
            <p className="text-sm text-[#555555]">
              Prepared by <span className="font-medium">{batch?.shadchan_name}</span>
              {' · '}
              {batch?.created_at && new Date(batch.created_at).toLocaleDateString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric',
              })}
            </p>
          </div>
          <span className="text-xs bg-yellow-100 text-yellow-700 font-medium px-3 py-1 rounded-full">
            Pending Your Review
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 text-sm text-blue-800">
          Please review the {singles.length} single{singles.length !== 1 ? 's' : ''} below. When everything looks correct,
          click <strong>Looks Good</strong> at the bottom to send it to the admin for final import.
          You may leave optional notes before submitting.
        </div>

        {/* Singles table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#555555] w-16">Photo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#555555]">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#555555] w-16">Gender</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#555555] w-12">Age</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#555555]">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#555555]">City</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#555555] w-14">Height</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#555555]">School</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#555555]">Plans</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#555555]">Notes</th>
                </tr>
              </thead>
              <tbody>
                {singles.map(record => {
                  const notesExpanded = expandedNotes.has(record._id)
                  return (
                    <tr key={record._id} className="border-b border-gray-100 last:border-0">
                      <td className="px-4 py-3">
                        {record.photo_url ? (
                          <img src={record.photo_url} alt="" className="w-11 h-11 rounded-lg object-cover" />
                        ) : (
                          <div className="w-11 h-11 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 text-xs">—</div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-[#1A1A1A]">
                        {record.first_name} {record.last_name}
                      </td>
                      <td className="px-4 py-3 text-[#555555] capitalize">
                        {record.gender ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-[#555555]">
                        {record.age ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-[#555555]">
                        {record.phone ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-[#555555]">
                        {[record.city, record.state].filter(Boolean).join(', ') || '—'}
                      </td>
                      <td className="px-4 py-3 text-[#555555] whitespace-nowrap">
                        {fmtHeight(record.height_inches)}
                      </td>
                      <td className="px-4 py-3 text-[#555555] max-w-[180px] truncate">
                        {record.current_yeshiva_seminary ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-[#555555] max-w-[160px] truncate">
                        {record.plans ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        {record.raw_notes.length > 0 ? (
                          <div>
                            <button
                              className="flex items-center gap-1 text-xs text-[#888888] hover:text-[#555555]"
                              onClick={() =>
                                setExpandedNotes(prev => {
                                  const next = new Set(prev)
                                  if (next.has(record._id)) next.delete(record._id)
                                  else next.add(record._id)
                                  return next
                                })
                              }
                            >
                              {notesExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                              {record.raw_notes.length}
                            </button>
                            {notesExpanded && (
                              <ul className="mt-1 space-y-0.5 max-w-xs">
                                {record.raw_notes.map((note, ni) => (
                                  <li key={ni} className="text-xs text-[#888888]">{note}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Approval section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-[#1A1A1A]">Submit Your Review</h2>
          <div>
            <label className="text-sm text-[#555555] block mb-1.5">
              Optional notes for the admin
            </label>
            <textarea
              value={comments}
              onChange={e => setComments(e.target.value)}
              rows={3}
              placeholder="Any corrections, additions, or comments…"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-[#1A1A1A] placeholder-gray-400 focus:outline-none focus:border-brand-maroon resize-none"
            />
          </div>
          <Button
            className="btn-primary w-full gap-2 py-3"
            onClick={handleApprove}
            disabled={submitting}
          >
            <CheckCircle className="h-4 w-4" />
            {submitting ? 'Submitting…' : 'Looks Good — Send to Admin for Approval'}
          </Button>
        </div>
      </main>
    </div>
  )
}
