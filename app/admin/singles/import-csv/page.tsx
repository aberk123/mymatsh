'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
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
  FileText,
  ChevronLeft,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Loader2,
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

// Known DB fields for mapping
const DB_FIELDS: { value: string; label: string }[] = [
  { value: '', label: '— Skip —' },
  { value: 'first_name', label: 'First Name' },
  { value: 'last_name', label: 'Last Name' },
  { value: 'gender', label: 'Gender' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'city', label: 'City' },
  { value: 'state', label: 'State' },
  { value: 'age', label: 'Age' },
  { value: 'dob', label: 'Date of Birth' },
  { value: 'height_inches', label: 'Height (inches)' },
  { value: 'hashkafa', label: 'Hashkafa' },
  { value: 'plans', label: 'Plans' },
  { value: 'about_bio', label: 'About / Bio' },
  { value: 'looking_for', label: 'Looking For' },
  { value: 'family_background', label: 'Family Background' },
  { value: 'current_yeshiva_seminary', label: 'Yeshiva / Seminary' },
  { value: 'eretz_yisroel', label: 'Eretz Yisroel' },
  { value: 'address', label: 'Address' },
  { value: 'country', label: 'Country' },
  { value: 'occupation', label: 'Occupation' },
  { value: 'full_hebrew_name', label: 'Hebrew Name' },
]

const KNOWN_FIELD_VALUES = new Set(DB_FIELDS.map(f => f.value).filter(Boolean))

// Auto-map a CSV header → DB field name
function autoMap(header: string): string {
  const h = header.toLowerCase().trim().replace(/[\s-]+/g, '_')
  const ALIASES: Record<string, string> = {
    about_me: 'about_bio',
    bio: 'about_bio',
    about: 'about_bio',
    yeshiva: 'current_yeshiva_seminary',
    seminary: 'current_yeshiva_seminary',
    hebrew_name: 'full_hebrew_name',
    height: 'height_inches',
    date_of_birth: 'dob',
    birth_date: 'dob',
    firstname: 'first_name',
    lastname: 'last_name',
    first: 'first_name',
    last: 'last_name',
    location: 'city',
  }
  if (ALIASES[h]) return ALIASES[h]
  if (KNOWN_FIELD_VALUES.has(h)) return h
  return ''
}

// Simple but correct CSV parser (handles quoted fields with embedded commas/newlines)
function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const result: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  const n = text.length

  for (let i = 0; i < n; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < n && text[i + 1] === '"') { field += '"'; i++ }
        else inQuotes = false
      } else {
        field += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        row.push(field); field = ''
      } else if (ch === '\n') {
        row.push(field); field = ''
        if (row.length > 1 || row[0] !== '') result.push(row)
        row = []
      } else if (ch !== '\r') {
        field += ch
      }
    }
  }
  row.push(field)
  if (row.length > 1 || row[0] !== '') result.push(row)

  if (result.length === 0) return { headers: [], rows: [] }
  const headers = result[0].map(h => h.trim())
  return { headers, rows: result.slice(1) }
}

interface Shadchan { id: string; full_name: string }
type Phase = 'upload' | 'map' | 'importing' | 'done'

interface ImportResult {
  imported: number
  duplicates: number
  errors: number
  error_details: string[]
}

export default function ImportCsvPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [phase, setPhase] = useState<Phase>('upload')
  const [shadchanim, setShadchanim] = useState<Shadchan[]>([])
  const [selectedShadchan, setSelectedShadchan] = useState('')
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<string[][]>([])
  const [columnMap, setColumnMap] = useState<Record<number, string>>({}) // index → dbField
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [importError, setImportError] = useState('')

  useEffect(() => {
    const supabase = createClient()
    async function load() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('shadchan_profiles') as any)
        .select('id, full_name')
        .eq('is_approved', true)
        .order('full_name') as { data: Shadchan[] | null }
      setShadchanim(data ?? [])
    }
    load()
  }, [])

  function handleFile(file: File) {
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv' && !file.name.endsWith('.txt')) return
    setCsvFile(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = (e.target?.result as string) ?? ''
      const { headers: h, rows: r } = parseCSV(text)
      if (h.length === 0) return
      setHeaders(h)
      setRows(r)
      // Auto-map columns
      const map: Record<number, string> = {}
      h.forEach((col, i) => { map[i] = autoMap(col) })
      setColumnMap(map)
      setPhase('map')
    }
    reader.readAsText(file)
  }

  async function handleImport() {
    setImporting(true)
    setImportError('')

    // Build mapped rows from CSV data
    const mappedRows = rows.map(row => {
      const record: Record<string, string> = {}
      headers.forEach((_, colIdx) => {
        const dbField = columnMap[colIdx]
        if (dbField && row[colIdx] !== undefined) {
          record[dbField] = row[colIdx].trim()
        }
      })
      return record
    })

    try {
      const res = await fetch('/api/admin/singles/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: mappedRows, shadchan_id: selectedShadchan }),
      })
      const json = await res.json()
      if (!res.ok) {
        setImportError(json.error ?? 'Import failed. Please try again.')
        setImporting(false)
        return
      }
      setResult(json as ImportResult)
      setPhase('done')
    } catch {
      setImportError('Network error. Please try again.')
    } finally {
      setImporting(false)
    }
  }

  function reset() {
    setPhase('upload')
    setCsvFile(null)
    setHeaders([])
    setRows([])
    setColumnMap({})
    setResult(null)
    setImportError('')
  }

  const previewRows = rows.slice(0, 5)
  const totalRows = rows.length

  // Check if required fields are mapped
  const mappedFields = new Set(Object.values(columnMap).filter(Boolean))
  const hasFirstName = mappedFields.has('first_name')
  const hasLastName = mappedFields.has('last_name')
  const hasGender = mappedFields.has('gender')
  const canImport = hasFirstName && hasLastName && hasGender && !!selectedShadchan && totalRows > 0

  return (
    <AppLayout navItems={navItems} title="Import Singles from CSV" role="platform_admin">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <Link href="/admin/singles" className="inline-flex items-center gap-1.5 text-sm text-[#555555] hover:text-brand-maroon transition-colors">
            <ChevronLeft className="h-4 w-4" />
            Back to Singles
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-xl font-semibold text-[#1A1A1A]">Import Singles from CSV</h1>
          <p className="text-sm text-[#555555] mt-1">
            Upload a CSV file and map columns to singles table fields. Duplicates (same first + last name) are automatically skipped.
          </p>
        </div>

        {/* ── Phase: Upload ──────────────────────────────────────────────── */}
        {phase === 'upload' && (
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
              <p className="text-xs text-[#888888] mt-1">
                Imported singles will be assigned to this shadchan as their creator.
              </p>
            </div>

            <div>
              <Label className="field-label">CSV File</Label>
              <div
                className="mt-1 border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-brand-maroon/40 transition-colors"
                onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
              >
                {csvFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="h-10 w-10 text-brand-maroon" />
                    <p className="text-sm font-medium text-[#1A1A1A]">{csvFile.name}</p>
                    <p className="text-xs text-[#888888]">{(csvFile.size / 1024).toFixed(1)} KB</p>
                    <button
                      className="text-xs text-brand-maroon underline"
                      onClick={e => { e.stopPropagation(); setCsvFile(null) }}
                    >Remove</button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-10 w-10 text-gray-300" />
                    <p className="text-sm text-[#555555]">Drop CSV file here or click to browse</p>
                    <p className="text-xs text-[#888888]">.csv files · UTF-8 encoding recommended</p>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
            </div>

            <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
              <p className="text-xs font-semibold text-[#555555] mb-2">Expected columns (from migration script)</p>
              <p className="text-xs text-[#888888] font-mono leading-relaxed">
                first_name, last_name, gender, email, phone, city, state, age, dob, height_inches,
                hashkafa, plans, about_me, looking_for, family_background, current_yeshiva_seminary, eretz_yisroel
              </p>
              <p className="text-xs text-[#888888] mt-2">Other column names are supported via auto-mapping. You can also adjust mappings manually.</p>
            </div>
          </div>
        )}

        {/* ── Phase: Map + Preview ───────────────────────────────────────── */}
        {phase === 'map' && (
          <div className="space-y-5">
            {/* Shadchan selector (repeated for convenience) */}
            {!selectedShadchan && (
              <div className="card p-4">
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
            )}

            {/* Column mapping */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-[#1A1A1A]">
                  Column Mapping
                  <span className="ml-2 text-sm font-normal text-[#888888]">
                    {csvFile?.name} · {totalRows.toLocaleString()} rows
                  </span>
                </h2>
                <button
                  onClick={reset}
                  className="text-xs text-brand-maroon hover:underline"
                >
                  Upload different file
                </button>
              </div>

              {(!hasFirstName || !hasLastName || !hasGender) && (
                <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-700 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>
                    Required fields not yet mapped:{' '}
                    {[!hasFirstName && 'First Name', !hasLastName && 'Last Name', !hasGender && 'Gender']
                      .filter(Boolean).join(', ')}
                  </span>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 pr-4 font-medium text-[#555555] text-xs uppercase tracking-wide w-1/3">CSV Column</th>
                      <th className="text-left py-2 pr-4 font-medium text-[#555555] text-xs uppercase tracking-wide w-1/3">Maps To</th>
                      <th className="text-left py-2 font-medium text-[#555555] text-xs uppercase tracking-wide">Sample Values</th>
                    </tr>
                  </thead>
                  <tbody>
                    {headers.map((header, colIdx) => (
                      <tr key={colIdx} className="border-b border-gray-50 last:border-0">
                        <td className="py-2 pr-4">
                          <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded text-[#555555]">{header}</span>
                        </td>
                        <td className="py-2 pr-4">
                          <select
                            className="input-base text-sm py-1 w-full"
                            value={columnMap[colIdx] ?? ''}
                            onChange={e => setColumnMap(prev => ({ ...prev, [colIdx]: e.target.value }))}
                          >
                            {DB_FIELDS.map(f => (
                              <option key={f.value} value={f.value}>{f.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 text-xs text-[#888888] max-w-[200px]">
                          <span className="truncate block">
                            {previewRows
                              .map(r => r[colIdx])
                              .filter(v => v?.trim())
                              .slice(0, 3)
                              .join(', ') || '—'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Preview table */}
            <div className="card p-0 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-[#1A1A1A]">
                  Preview — first {Math.min(5, totalRows)} of {totalRows.toLocaleString()} rows
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="text-xs w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      {headers.map((h, i) => (
                        columnMap[i] ? (
                          <th key={i} className="px-3 py-2 text-left font-medium text-[#555555] whitespace-nowrap">
                            {DB_FIELDS.find(f => f.value === columnMap[i])?.label ?? columnMap[i]}
                          </th>
                        ) : null
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, ri) => (
                      <tr key={ri} className="border-b border-gray-100 last:border-0">
                        {headers.map((_, ci) => (
                          columnMap[ci] ? (
                            <td key={ci} className="px-3 py-2 text-[#555555] max-w-[180px]">
                              <span className="truncate block">{row[ci] || '—'}</span>
                            </td>
                          ) : null
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {importError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                {importError}
              </div>
            )}

            <div className="flex items-center justify-between">
              <button onClick={reset} className="text-sm text-[#888888] hover:text-[#555555]">
                ← Upload different file
              </button>
              <Button
                variant="primary"
                disabled={!canImport || importing}
                onClick={handleImport}
                className="gap-2 min-w-[200px]"
              >
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importing…
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Import {totalRows.toLocaleString()} Records
                  </>
                )}
              </Button>
            </div>

            {!canImport && !importing && (
              <p className="text-xs text-[#888888] text-right -mt-3">
                {!selectedShadchan && 'Select a shadchan · '}
                {(!hasFirstName || !hasLastName || !hasGender) && 'Map required fields (First Name, Last Name, Gender)'}
              </p>
            )}
          </div>
        )}

        {/* ── Phase: Done ────────────────────────────────────────────────── */}
        {phase === 'done' && result && (
          <div className="card space-y-5">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500 flex-shrink-0" />
              <div>
                <p className="text-lg font-semibold text-[#1A1A1A]">Import Complete</p>
                <p className="text-sm text-[#555555]">
                  {csvFile?.name} · {totalRows.toLocaleString()} rows processed
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-center">
                <p className="text-3xl font-bold text-green-700">{result.imported}</p>
                <p className="text-sm text-green-600 mt-1">Imported</p>
              </div>
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-center">
                <p className="text-3xl font-bold text-amber-700">{result.duplicates}</p>
                <p className="text-sm text-amber-600 mt-1">Skipped (duplicates)</p>
              </div>
              <div className={`rounded-xl p-4 text-center border ${result.errors > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                <p className={`text-3xl font-bold ${result.errors > 0 ? 'text-red-700' : 'text-gray-500'}`}>{result.errors}</p>
                <p className={`text-sm mt-1 ${result.errors > 0 ? 'text-red-600' : 'text-gray-500'}`}>Errors</p>
              </div>
            </div>

            {result.error_details.length > 0 && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                <p className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4" />
                  Error details (first {result.error_details.length}):
                </p>
                <ul className="space-y-1">
                  {result.error_details.map((e, i) => (
                    <li key={i} className="text-xs text-red-600 font-mono">{e}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <Link href="/admin/singles">
                <Button variant="primary">View Singles →</Button>
              </Link>
              <Button variant="secondary" onClick={reset}>Import Another File</Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
