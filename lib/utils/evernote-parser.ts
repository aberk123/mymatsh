// Client-side only: extract text from Evernote HTML.
// All field parsing is handled server-side by the Claude API.

export interface ParsedSingle {
  // Internal tracking
  _id: string
  _source_file: string
  _parse_error: string | null
  _skip: boolean
  _is_duplicate: boolean
  _duplicate_match: string | null
  parse_method: 'ai' | 'fallback' | 'failed'
  parse_confidence: 'high' | 'medium' | 'low' | null

  // Identity
  first_name: string
  last_name: string
  gender: 'male' | 'female' | null

  // Contact
  phone: string | null
  mother_phone: string | null
  father_phone: string | null

  // Age / dates
  age: number | null
  birth_month: string | null
  dob: string | null

  // Location
  city: string | null
  state: string | null
  address: string | null

  // Physical
  height_inches: number | null

  // Education / background
  current_yeshiva_seminary: string | null
  previous_yeshivos: string | null
  rebbi: string | null
  eretz_yisroel: string | null
  hashkafa: string | null

  // Family
  father_name: string | null
  father_occupation: string | null
  mother_name: string | null
  mother_occupation: string | null
  parents_location: string | null
  sibling_position: string | null
  family_background: string | null

  // Profile
  plans: string | null
  looking_for: string | null
  about_me: string | null
  out_of_town: string | null

  // Photo
  photo_url: string | null

  // Catch-all for unassigned content
  raw_notes: string[]
}

// ── HTML text extractor (browser-side) ───────────────────────────────────────

export interface ExtractedNote {
  id: string
  source_file: string
  title: string
  text: string
}

/** Strip Evernote HTML down to plain text for shipping to the API. */
export function extractNoteText(html: string, sourceFile: string): ExtractedNote {
  const id = typeof crypto !== 'undefined'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)

  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    // Title from h1 or <title>
    const title = (
      doc.querySelector('h1')?.textContent?.trim() ||
      doc.querySelector('title')?.textContent?.trim() ||
      ''
    ).replace(/\s+/g, ' ')

    const lines: string[] = []

    // Prefer .para divs; fall back to all leaf block elements
    const paras = doc.querySelectorAll('.para, div.para')
    if (paras.length > 0) {
      paras.forEach(el => {
        el.querySelectorAll('br').forEach(br => br.replaceWith('\n'))
        const text = el.textContent?.trim()
        if (text) text.split('\n').forEach(l => { const t = l.trim(); if (t) lines.push(t) })
      })
    } else {
      const body = doc.body
      if (body) {
        body.querySelectorAll('div, p, li').forEach(el => {
          if (!el.querySelector('div, p, li')) {
            el.querySelectorAll('br').forEach(br => br.replaceWith('\n'))
            const text = el.textContent?.trim()
            if (text) text.split('\n').forEach(l => { const t = l.trim(); if (t) lines.push(t) })
          }
        })
      }
    }

    return { id, source_file: sourceFile, title, text: lines.join('\n') }
  } catch {
    return { id, source_file: sourceFile, title: '', text: '' }
  }
}

// ── Fallback: name + phone extraction for failed AI calls ────────────────────

function extractPhonesFromText(text: string): string[] {
  const phones: string[] = []
  const matches = text.match(/[\d\s\-\.\(\)\+]{10,16}/g) ?? []
  for (const m of matches) {
    const digits = m.replace(/\D/g, '')
    if (digits.length >= 10 && digits.length <= 11) phones.push(m.trim())
  }
  return phones.filter((p, i) => phones.indexOf(p) === i)
}

export function buildFallbackRecord(note: ExtractedNote): ParsedSingle {
  // Try to parse name from title: "Last, First" or "First Last"
  let first = '', last = ''
  if (note.title) {
    if (note.title.includes(',')) {
      const [l, f] = note.title.split(',').map(s => s.trim())
      last = l; first = f
    } else {
      const parts = note.title.trim().split(/\s+/)
      first = parts[0] ?? ''
      last = parts.slice(1).join(' ')
    }
  }
  const phones = extractPhonesFromText(note.text)

  return {
    _id: note.id,
    _source_file: note.source_file,
    _parse_error: 'AI parse failed — manual review required',
    _skip: false,
    _is_duplicate: false,
    _duplicate_match: null,
    parse_method: 'failed',
    parse_confidence: 'low',
    first_name: first,
    last_name: last,
    gender: null,
    phone: phones[0] ?? null,
    mother_phone: phones[1] ?? null,
    father_phone: phones[2] ?? null,
    age: null, birth_month: null, dob: null,
    city: null, state: null, address: null,
    height_inches: null,
    current_yeshiva_seminary: null, previous_yeshivos: null,
    rebbi: null, eretz_yisroel: null, hashkafa: null,
    father_name: null, father_occupation: null,
    mother_name: null, mother_occupation: null,
    parents_location: null, sibling_position: null, family_background: null,
    plans: null, looking_for: null, about_me: null, out_of_town: null,
    photo_url: null,
    raw_notes: note.text ? note.text.split('\n').filter(Boolean) : [],
  }
}

// ── Legacy: duplicate check (still used by batch detail page) ────────────────

export interface ExistingSingle {
  id: string
  first_name: string
  last_name: string
  age: number | null
  dob: string | null
}

function approximateAge(dob: string): number | null {
  try {
    const birth = new Date(dob)
    const today = new Date()
    const age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    return m < 0 || (m === 0 && today.getDate() < birth.getDate()) ? age - 1 : age
  } catch { return null }
}

export function checkDuplicate(
  parsed: Pick<ParsedSingle, 'first_name' | 'last_name' | 'age' | 'dob'>,
  existing: ExistingSingle[]
): { isDuplicate: boolean; matchName: string | null } {
  const fn = parsed.first_name.toLowerCase().trim()
  const ln = parsed.last_name.toLowerCase().trim()
  for (const s of existing) {
    if (s.first_name.toLowerCase().trim() !== fn || s.last_name.toLowerCase().trim() !== ln) continue
    const pAge = parsed.age ?? (parsed.dob ? approximateAge(parsed.dob) : null)
    const sAge = s.age ?? (s.dob ? approximateAge(s.dob) : null)
    if (pAge !== null && sAge !== null) {
      if (Math.abs(pAge - sAge) <= 1) return { isDuplicate: true, matchName: `${s.first_name} ${s.last_name}` }
    } else {
      return { isDuplicate: true, matchName: `${s.first_name} ${s.last_name}` }
    }
  }
  return { isDuplicate: false, matchName: null }
}
