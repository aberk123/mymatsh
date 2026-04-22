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
import { parseEvernoteHtml, type ParsedSingle } from '@/lib/utils/evernote-parser'
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

const IMG_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'gif']

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

    const initSteps: ProgressStep[] = [
      { label: 'Unzipping archive', status: 'pending' },
      { label: 'Parsing HTML files', status: 'pending' },
      { label: 'Uploading photos', status: 'pending' },
      { label: 'Creating import batch', status: 'pending' },
    ]
    setSteps(initSteps)

    try {
      // Step 1: Unzip
      updateStep(0, { status: 'running' })
      const zip = await JSZip.loadAsync(zipFile)
      updateStep(0, { status: 'done', detail: `${Object.keys(zip.files).length} files found` })

      // Group files by folder (first path segment)
      const folderMap: Record<string, { html: { name: string; file: JSZip.JSZipObject } | null; images: { name: string; file: JSZip.JSZipObject }[] }> = {}

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
        // silently ignore other file types
      }

      // Step 2: Parse HTML
      updateStep(1, { status: 'running' })
      const parsed: ParsedSingle[] = []
      let parseErrors = 0

      for (const [folder, { html, images }] of Object.entries(folderMap)) {
        if (!html) continue // no HTML file in this folder
        const htmlStr = await html.file.async('text')
        const result = parseEvernoteHtml(htmlStr, html.name)
        // Attach image blobs for later upload
        ;(result as ParsedSingle & { _imageFiles?: { name: string; file: JSZip.JSZipObject }[] })._imageFiles = images
        if (result._parse_error) parseErrors++
        // Use folder name as fallback for name if parse failed
        if (!result.first_name && folder !== '__root__') {
          const parts = folder.split(/[\s,]+/)
          result.first_name = parts[0] ?? folder
          result.last_name = parts.slice(1).join(' ')
        }
        parsed.push(result)
      }

      updateStep(1, {
        status: 'done',
        detail: `${parsed.length} singles parsed${parseErrors ? `, ${parseErrors} errors` : ''}`,
      })

      // Step 3: Upload photos
      updateStep(2, { status: 'running' })
      let photoCount = 0
      let photoErrors = 0

      for (const record of parsed) {
        const rec = record as ParsedSingle & { _imageFiles?: { name: string; file: JSZip.JSZipObject }[] }
        if (!rec._imageFiles || rec._imageFiles.length === 0) continue
        const imgEntry = rec._imageFiles[0]
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
        // Remove the non-serializable _imageFiles before saving
        delete rec._imageFiles
      }

      updateStep(2, {
        status: photoErrors > 0 ? 'error' : 'done',
        detail: `${photoCount} uploaded${photoErrors ? `, ${photoErrors} failed` : ''}`,
      })

      // Step 4: Create batch
      updateStep(3, { status: 'running' })
      const res = await fetch('/api/admin/import-batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shadchan_id: selectedShadchan, parsed_data: parsed }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const batch = await res.json() as { id: string }
      updateStep(3, { status: 'done', detail: `Batch ${batch.id.slice(0, 8)}… created` })
      setBatchId(batch.id)
      setDone(true)
    } catch (err) {
      setSteps(prev => prev.map(s => s.status === 'running' ? { ...s, status: 'error', detail: err instanceof Error ? err.message : 'Failed' } : s))
    } finally {
      setRunning(false)
    }
  }

  return (
    <AppLayout navItems={navItems} title="Import from Evernote" role="platform_admin">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-[#1A1A1A]">Import Singles from Evernote</h1>
          <p className="text-sm text-[#555555] mt-1">
            Upload a ZIP file exported from Evernote. Each sub-folder should contain one HTML file and optional photos.
          </p>
        </div>

        {!running && !done && (
          <div className="card space-y-5">
            {/* Shadchan selector */}
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

            {/* File dropzone */}
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
                    >
                      Remove
                    </button>
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
                ref={fileRef}
                type="file"
                accept=".zip"
                className="hidden"
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

        {/* Progress steps */}
        {(running || done) && steps.length > 0 && (
          <div className="card space-y-3">
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
      </div>
    </AppLayout>
  )
}
