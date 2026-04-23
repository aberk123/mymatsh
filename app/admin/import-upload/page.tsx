'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import JSZip from 'jszip'
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Building2,
  Heart,
  Newspaper,
  DollarSign,
  ClipboardList,
  Upload,
  FileArchive,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  UsersRound,
  Home,
  BookOpen,
  MessageSquare,
  PackageOpen,
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import type { NavItem } from '@/components/ui/sidebar'
import { extractNoteText, type ParsedSingle, type ExtractedNote } from '@/lib/utils/evernote-parser'
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

interface Shadchan { id: string; full_name: string }

interface ProgressStep {
  label: string
  status: 'pending' | 'running' | 'done' | 'error'
  detail?: string
}

interface ParseStats {
  totalNotes: number
  parsedNotes: number
  totalBatches: number
  doneBatches: number
  inputTokens: number
  outputTokens: number
  startedAt: number
  finishedAt: number | null
  failedNotes: number
}

const IMG_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'gif']

function fmtHeight(inches: number | null): string {
  if (!inches) return '—'
  return `${Math.floor(inches / 12)}'${inches % 12}"`
}

function costUsd(inputTok: number, outputTok: number): string {
  const inRate = parseFloat(process.env.NEXT_PUBLIC_AI_COST_IN ?? '3.00')
  const outRate = parseFloat(process.env.NEXT_PUBLIC_AI_COST_OUT ?? '15.00')
  const cost = (inputTok / 1_000_000) * inRate + (outputTok / 1_000_000) * outRate
  return `$${cost.toFixed(4)}`
}

export default function ImportUploadPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [shadchanim, setShadchanim] = useState<Shadchan[]>([])
  const [selectedShadchan, setSelectedShadchan] = useState('')
  const [zipFile, setZipFile] = useState<File | null>(null)
  const [steps, setSteps] = useState<ProgressStep[]>([])
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const [batchId, setBatchId] = useState('')
  const [parseStats, setParseStats] = useState<ParseStats | null>(null)
  const [previewRecords, setPreviewRecords] = useState<ParsedSingle[]>([])

  useEffect(() => {
    const supabase = createClient()
    async function loadShadchanim() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('shadchan_profiles') as any)
        .select('id, full_name')
        .eq('is_approved', true)
        .order('full_name', { ascending: true }) as { data: Shadchan[] | null }
      setShadchanim(data ?? [])
    }
    loadShadchanim()
  }, [])

  function updateStep(idx: number, patch: Partial<ProgressStep>) {
    setSteps(prev => prev.map((s, i) => i === idx ? { ...s, ...patch } : s))
  }

  async function handleImport() {
    if (!zipFile || !selectedShadchan) return
    setRunning(true)
    setDone(false)
    setPreviewRecords([])
    setParseStats(null)

    const batchSize = parseInt(process.env.NEXT_PUBLIC_AI_BATCH_SIZE ?? '10', 10)
    const parallelBatches = parseInt(process.env.NEXT_PUBLIC_AI_PARALLEL_BATCHES ?? '3', 10)
    const delayMs = parseInt(process.env.NEXT_PUBLIC_AI_DELAY_MS ?? '200', 10)

    const initSteps: ProgressStep[] = [
      { label: 'Unzipping archive', status: 'pending' },
      { label: 'Extracting note text', status: 'pending' },
      { label: 'AI parsing notes', status: 'pending' },
      { label: 'Uploading photos', status: 'pending' },
      { label: 'Creating import batch', status: 'pending' },
    ]
    setSteps(initSteps)

    try {
      // ── Step 1: Unzip ──────────────────────────────────────────────────────
      updateStep(0, { status: 'running' })
      const zip = await JSZip.loadAsync(zipFile)
      updateStep(0, { status: 'done', detail: `${Object.keys(zip.files).length} files found` })

      // Group files by folder
      type FolderEntry = { html: { name: string; file: JSZip.JSZipObject } | null; images: { name: string; file: JSZip.JSZipObject }[] }
      const folderMap: Record<string, FolderEntry> = {}
      for (const [path, file] of Object.entries(zip.files)) {
        if (file.dir) continue
        const parts = path.split('/')
        const folder = parts.length > 1 ? parts[0] : '__root__'
        if (!folderMap[folder]) folderMap[folder] = { html: null, images: [] }
        const ext = path.split('.').pop()?.toLowerCase() ?? ''
        if (ext === 'html' || ext === 'htm') {
          folderMap[folder].html = { name: path, file }
        } else if (IMG_EXTS.includes(ext)) {
          folderMap[folder].images.push({ name: path, file })
        }
      }

      // ── Step 2: Extract text ───────────────────────────────────────────────
      updateStep(1, { status: 'running' })
      type NoteWithImages = ExtractedNote & { _imageFiles: { name: string; file: JSZip.JSZipObject }[] }
      const extractedNotes: NoteWithImages[] = []

      for (const [folder, { html, images }] of Object.entries(folderMap)) {
        if (!html) continue
        const htmlStr = await html.file.async('text')
        const note = extractNoteText(htmlStr, html.name)
        // Fallback name from folder if title empty
        if (!note.title && folder !== '__root__') {
          note.title = folder.replace(/[\-_]/g, ' ')
        }
        extractedNotes.push({ ...note, _imageFiles: images })
      }

      updateStep(1, { status: 'done', detail: `${extractedNotes.length} notes extracted` })

      // ── Step 3: AI parsing ─────────────────────────────────────────────────
      updateStep(2, { status: 'running' })

      const totalNotes = extractedNotes.length
      const batches: NoteWithImages[][] = []
      for (let i = 0; i < totalNotes; i += batchSize) {
        batches.push(extractedNotes.slice(i, i + batchSize))
      }

      const stats: ParseStats = {
        totalNotes,
        parsedNotes: 0,
        totalBatches: batches.length,
        doneBatches: 0,
        inputTokens: 0,
        outputTokens: 0,
        startedAt: Date.now(),
        finishedAt: null,
        failedNotes: 0,
      }
      setParseStats({ ...stats })

      // Map from note id → image files (for photo upload step)
      const imagesByNoteId: Record<string, { name: string; file: JSZip.JSZipObject }[]> = {}
      for (const n of extractedNotes) imagesByNoteId[n.id] = n._imageFiles

      // All parsed records, indexed by note id for photo attachment
      const parsedById: Record<string, ParsedSingle> = {}

      // Process in groups of parallelBatches
      for (let groupStart = 0; groupStart < batches.length; groupStart += parallelBatches) {
        const group = batches.slice(groupStart, groupStart + parallelBatches)

        const groupResults = await Promise.all(
          group.map(async (batch) => {
            const notes = batch.map(n => ({ id: n.id, source_file: n.source_file, title: n.title, text: n.text }))
            const res = await fetch('/api/admin/parse-evernote-batch', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ notes }),
            })
            if (!res.ok) {
              // Build fallback records
              return {
                records: batch.map(n => ({
                  _id: n.id, _source_file: n.source_file,
                  _parse_error: 'AI parse failed — manual review required',
                  _skip: false, _is_duplicate: false, _duplicate_match: null,
                  parse_method: 'failed' as const, parse_confidence: 'low' as const,
                  first_name: '', last_name: '', gender: null,
                  phone: null, mother_phone: null, father_phone: null,
                  age: null, birth_month: null, dob: null,
                  city: null, state: null, address: null, height_inches: null,
                  current_yeshiva_seminary: null, previous_yeshivos: null,
                  rebbi: null, eretz_yisroel: null, hashkafa: null,
                  father_name: null, father_occupation: null,
                  mother_name: null, mother_occupation: null,
                  parents_location: null, sibling_position: null, family_background: null,
                  plans: null, looking_for: null, about_me: null, out_of_town: null,
                  photo_url: null, raw_notes: [],
                })) as ParsedSingle[],
                inputTokens: 0,
                outputTokens: 0,
                failed: batch.length,
              }
            }
            const data = await res.json() as { records: ParsedSingle[]; inputTokens: number; outputTokens: number }
            return { ...data, failed: data.records.filter(r => r.parse_method === 'failed').length }
          })
        )

        for (const result of groupResults) {
          for (const record of result.records) {
            parsedById[record._id] = record
          }
          stats.parsedNotes += result.records.length
          stats.doneBatches += 1
          stats.inputTokens += result.inputTokens
          stats.outputTokens += result.outputTokens
          stats.failedNotes += result.failed
        }

        // Stream preview records as each group finishes
        setPreviewRecords(Object.values(parsedById))
        setParseStats({ ...stats })

        updateStep(2, {
          status: 'running',
          detail: `${stats.parsedNotes} of ${totalNotes} notes parsed (${stats.doneBatches}/${batches.length} batches)`,
        })

        if (groupStart + parallelBatches < batches.length) {
          await new Promise(r => setTimeout(r, delayMs))
        }
      }

      stats.finishedAt = Date.now()
      setParseStats({ ...stats })

      const failCount = Object.values(parsedById).filter(r => r.parse_method === 'failed').length
      updateStep(2, {
        status: failCount > 0 ? 'error' : 'done',
        detail: `${totalNotes} notes parsed in ${batches.length} API calls${failCount ? `, ${failCount} failed` : ''}`,
      })

      // Final ordered list of parsed records
      const allParsed: ParsedSingle[] = extractedNotes.map(n => parsedById[n.id]).filter(Boolean)

      // ── Step 4: Upload photos ──────────────────────────────────────────────
      updateStep(3, { status: 'running' })
      let photoCount = 0
      let photoErrors = 0

      for (const record of allParsed) {
        const images = imagesByNoteId[record._id] ?? []
        if (images.length === 0) continue
        const imgEntry = images[0]
        try {
          const blob = await imgEntry.file.async('blob')
          const ext = imgEntry.name.split('.').pop() ?? 'jpg'
          const formData = new FormData()
          formData.append('file', new File([blob], `photo.${ext}`, { type: `image/${ext}` }))
          const res = await fetch('/api/admin/upload-profile-photo', { method: 'POST', body: formData })
          if (res.ok) {
            const { url } = await res.json() as { url: string }
            record.photo_url = url
            photoCount++
          } else {
            photoErrors++
          }
        } catch {
          photoErrors++
        }
      }

      updateStep(3, {
        status: photoErrors > 0 ? 'error' : 'done',
        detail: `${photoCount} uploaded${photoErrors ? `, ${photoErrors} failed` : ''}`,
      })

      // ── Step 5: Create batch ───────────────────────────────────────────────
      updateStep(4, { status: 'running' })
      const res = await fetch('/api/admin/import-batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shadchan_id: selectedShadchan, parsed_data: allParsed }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const batch = await res.json() as { id: string }
      updateStep(4, { status: 'done', detail: `Batch ${batch.id.slice(0, 8)}… created` })
      setBatchId(batch.id)
      setDone(true)
    } catch (err) {
      setSteps(prev => prev.map(s => s.status === 'running' ? { ...s, status: 'error', detail: err instanceof Error ? err.message : 'Failed' } : s))
    } finally {
      setRunning(false)
    }
  }

  const elapsedSec = parseStats
    ? ((parseStats.finishedAt ?? Date.now()) - parseStats.startedAt) / 1000
    : 0
  const avgSecPerNote = parseStats && parseStats.parsedNotes > 0
    ? (elapsedSec / parseStats.parsedNotes).toFixed(1)
    : null

  return (
    <AppLayout navItems={navItems} title="Import from Evernote" role="platform_admin">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-[#1A1A1A]">Import Singles from Evernote</h1>
          <p className="text-sm text-[#555555] mt-1">
            Upload a ZIP file exported from Evernote. Each sub-folder should contain one HTML file and optional photos.
            Notes are parsed by Claude AI.
          </p>
        </div>

        {!running && !done && (
          <div className="card space-y-5">
            <div>
              <Label className="field-label">Assign to Shadchan</Label>
              <select
                className="input-base mt-1 w-full"
                value={selectedShadchan}
                onChange={e => setSelectedShadchan(e.target.value)}
              >
                <option value="">— Select a shadchan —</option>
                {shadchanim.map(s => (
                  <option key={s.id} value={s.id}>{s.full_name}</option>
                ))}
              </select>
            </div>

            <div>
              <Label className="field-label">Evernote ZIP File</Label>
              <div
                className="mt-1 border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-brand-maroon/40 transition-colors"
                onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault()
                  const f = e.dataTransfer.files[0]
                  if (f?.name.endsWith('.zip')) setZipFile(f)
                }}
              >
                {zipFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <FileArchive className="h-10 w-10 text-brand-maroon" />
                    <p className="text-sm font-medium text-[#1A1A1A]">{zipFile.name}</p>
                    <p className="text-xs text-[#888888]">{(zipFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    <button
                      className="text-xs text-brand-maroon underline mt-1"
                      onClick={e => { e.stopPropagation(); setZipFile(null) }}
                    >Remove</button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-10 w-10 text-gray-300" />
                    <p className="text-sm text-[#555555]">Drop ZIP file here or click to browse</p>
                    <p className="text-xs text-[#888888]">.zip files only</p>
                  </div>
                )}
              </div>
              <input
                ref={fileRef} type="file" accept=".zip" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) setZipFile(f) }}
              />
            </div>

            <Button
              className="w-full btn-primary"
              disabled={!zipFile || !selectedShadchan}
              onClick={handleImport}
            >
              <Upload className="h-4 w-4 mr-2" />
              Start Import
            </Button>
          </div>
        )}

        {/* Progress */}
        {(running || done) && steps.length > 0 && (
          <div className="card space-y-4 mb-6">
            <h3 className="font-semibold text-[#1A1A1A]">Import Progress</h3>

            {steps.map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
                  {step.status === 'done' && <CheckCircle className="h-5 w-5 text-green-500" />}
                  {step.status === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
                  {step.status === 'running' && (
                    <div className="h-4 w-4 rounded-full border-2 border-brand-maroon border-t-transparent animate-spin" />
                  )}
                  {step.status === 'pending' && <div className="h-4 w-4 rounded-full bg-gray-200" />}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${step.status === 'error' ? 'text-red-600' : 'text-[#1A1A1A]'}`}>
                    {step.label}
                  </p>
                  {step.detail && <p className="text-xs text-[#888888]">{step.detail}</p>}
                </div>
              </div>
            ))}

            {/* AI parse progress bar */}
            {parseStats && parseStats.totalNotes > 0 && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-[#888888]">
                  <span>
                    Parsing notes… {parseStats.parsedNotes} of {parseStats.totalNotes} complete
                    {' '}({parseStats.doneBatches} of {parseStats.totalBatches} batches done)
                  </span>
                  {parseStats.finishedAt && avgSecPerNote && (
                    <span>{avgSecPerNote}s per note · {elapsedSec.toFixed(1)}s total</span>
                  )}
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 bg-brand-maroon rounded-full transition-all duration-300"
                    style={{ width: `${(parseStats.parsedNotes / parseStats.totalNotes) * 100}%` }}
                  />
                </div>
                {parseStats.finishedAt && (
                  <p className="text-xs text-[#888888]">
                    {parseStats.parsedNotes} notes · {parseStats.totalBatches} API calls ·{' '}
                    {parseStats.inputTokens.toLocaleString()} input tokens ·{' '}
                    {parseStats.outputTokens.toLocaleString()} output tokens ·{' '}
                    est. {costUsd(parseStats.inputTokens, parseStats.outputTokens)}
                    {parseStats.failedNotes > 0 && (
                      <span className="text-red-600"> · {parseStats.failedNotes} failed</span>
                    )}
                  </p>
                )}
              </div>
            )}

            {done && batchId && (
              <div className="pt-4 border-t border-gray-100 flex gap-3">
                <Button className="btn-primary flex-1" onClick={() => router.push(`/admin/import-batches/${batchId}`)}>
                  Review Import Batch →
                </Button>
                <Button variant="secondary" onClick={() => router.push('/admin/import-batches')}>
                  All Batches
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Streaming preview table */}
        {previewRecords.length > 0 && (
          <div className="card p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <p className="text-sm font-semibold text-[#1A1A1A]">
                Preview ({previewRecords.length} parsed so far)
              </p>
              {parseStats?.failedNotes ? (
                <span className="text-xs text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {parseStats.failedNotes} failed
                </span>
              ) : null}
            </div>
            <div className="overflow-x-auto">
              <table className="text-xs w-full min-w-[900px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-3 py-2 text-left font-medium text-[#555555]">Name</th>
                    <th className="px-3 py-2 text-left font-medium text-[#555555]">Gender</th>
                    <th className="px-3 py-2 text-left font-medium text-[#555555]">Age</th>
                    <th className="px-3 py-2 text-left font-medium text-[#555555]">City</th>
                    <th className="px-3 py-2 text-left font-medium text-[#555555]">Height</th>
                    <th className="px-3 py-2 text-left font-medium text-[#555555]">Phone</th>
                    <th className="px-3 py-2 text-left font-medium text-[#555555]">Method</th>
                    <th className="px-3 py-2 text-left font-medium text-[#555555]">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRecords.map(r => (
                    <tr
                      key={r._id}
                      className={[
                        'border-b border-gray-100',
                        r.parse_method === 'failed' ? 'bg-red-50' : '',
                        r.parse_confidence === 'low' && r.parse_method !== 'failed' ? 'bg-yellow-50/60' : '',
                      ].join(' ')}
                    >
                      <td className="px-3 py-2 font-medium text-[#1A1A1A]">
                        {r.first_name || r.last_name ? `${r.first_name} ${r.last_name}`.trim() : <span className="text-[#BBBBBB]">—</span>}
                      </td>
                      <td className="px-3 py-2 text-[#555555] capitalize">{r.gender ?? '—'}</td>
                      <td className="px-3 py-2 text-[#555555]">{r.age ?? '—'}</td>
                      <td className="px-3 py-2 text-[#555555]">{[r.city, r.state].filter(Boolean).join(', ') || '—'}</td>
                      <td className="px-3 py-2 text-[#555555]">{fmtHeight(r.height_inches)}</td>
                      <td className="px-3 py-2 text-[#555555]">{r.phone ?? '—'}</td>
                      <td className="px-3 py-2">
                        {r.parse_method === 'ai' && (
                          <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full">AI</span>
                        )}
                        {r.parse_method === 'failed' && (
                          <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">Failed</span>
                        )}
                        {r.parse_method === 'fallback' && (
                          <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">Fallback</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {r.parse_confidence === 'high' && (
                          <span className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full">High</span>
                        )}
                        {r.parse_confidence === 'medium' && (
                          <span className="text-[10px] bg-gray-100 text-[#555555] px-1.5 py-0.5 rounded-full">Medium</span>
                        )}
                        {r.parse_confidence === 'low' && (
                          <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">Low</span>
                        )}
                        {!r.parse_confidence && <span className="text-[#BBBBBB]">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
