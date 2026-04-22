export interface ParsedSingle {
  _id: string
  _source_file: string
  _parse_error: string | null
  first_name: string
  last_name: string
  gender: 'male' | 'female' | null
  phone: string | null
  mother_phone: string | null
  father_phone: string | null
  age: number | null
  birth_month: string | null
  dob: string | null
  city: string | null
  state: string | null
  address: string | null
  height_inches: number | null
  current_yeshiva_seminary: string | null
  rebbi: string | null
  father_name: string | null
  father_occupation: string | null
  mother_name: string | null
  mother_occupation: string | null
  parents_location: string | null
  sibling_position: string | null
  plans: string | null
  looking_for: string | null
  eretz_yisroel: string | null
  photo_url: string | null
  raw_notes: string[]
  _is_duplicate: boolean
  _duplicate_match: string | null
  _skip: boolean
}

// ─── helpers ─────────────────────────────────────────────────────────────────

const MONTHS = ['january','february','march','april','may','june','july','august','september','october','november','december']
const MONTHS_SHORT = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']

function isPhoneLike(s: string): boolean {
  const digits = s.replace(/\D/g, '')
  if (digits.length < 10 || digits.length > 11) return false
  return /^[\d\s\-\.\(\)\+]+$/.test(s.trim())
}

function parsePhone(s: string): string {
  return s.trim()
}

// Returns { dob } or null
function parseDateString(s: string): { dob: string } | null {
  const t = s.trim()
  // mm/dd/yyyy or mm-dd-yyyy or mm.dd.yyyy
  const slashMatch = t.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/)
  if (slashMatch) {
    const [, m, d, y] = slashMatch
    const year = y.length === 2 ? `19${y}` : y
    return { dob: `${year}-${m.padStart(2,'0')}-${d.padStart(2,'0')}` }
  }
  // Month Day, Year  e.g. "January 15, 2001" or "Jan 15 2001"
  const monthNameMatch = t.match(/^([A-Za-z]+)\.?\s+(\d{1,2}),?\s+(\d{4})$/)
  if (monthNameMatch) {
    const [, mon, d, y] = monthNameMatch
    const mIdx = MONTHS.indexOf(mon.toLowerCase())
    const mIdxS = MONTHS_SHORT.indexOf(mon.toLowerCase().slice(0,3))
    const mNum = mIdx !== -1 ? mIdx + 1 : mIdxS !== -1 ? mIdxS + 1 : null
    if (mNum) return { dob: `${y}-${String(mNum).padStart(2,'0')}-${d.padStart(2,'0')}` }
  }
  // Day Month Year e.g. "15 January 2001"
  const dayMonthMatch = t.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/)
  if (dayMonthMatch) {
    const [, d, mon, y] = dayMonthMatch
    const mIdx = MONTHS.indexOf(mon.toLowerCase())
    const mIdxS = MONTHS_SHORT.indexOf(mon.toLowerCase().slice(0,3))
    const mNum = mIdx !== -1 ? mIdx + 1 : mIdxS !== -1 ? mIdxS + 1 : null
    if (mNum) return { dob: `${y}-${String(mNum).padStart(2,'0')}-${d.padStart(2,'0')}` }
  }
  return null
}

// Returns { age, birth_month } or null
function parseAgeLine(s: string): { age: number; birth_month: string | null } | null {
  const t = s.trim()
  // "24" alone
  const alone = t.match(/^(\d{2})$/)
  if (alone) {
    const n = parseInt(alone[1], 10)
    if (n >= 16 && n <= 99) return { age: n, birth_month: null }
  }
  // "24 (Aug)" or "24(Aug)"
  const withParen = t.match(/^(\d{2})\s*\(([A-Za-z]+)\)$/)
  if (withParen) {
    const n = parseInt(withParen[1], 10)
    if (n >= 16 && n <= 99) return { age: n, birth_month: withParen[2] }
  }
  // "24 Aug" or "24, Aug"
  const withSpace = t.match(/^(\d{2})[,\s]+([A-Za-z]+)$/)
  if (withSpace) {
    const n = parseInt(withSpace[1], 10)
    const mon = withSpace[2].toLowerCase()
    if (n >= 16 && n <= 99 && (MONTHS.includes(mon) || MONTHS_SHORT.includes(mon.slice(0,3)))) {
      return { age: n, birth_month: withSpace[2] }
    }
  }
  // "Age 24" or "Age: 24"
  const labeled = t.match(/^[Aa]ge:?\s*(\d{2})/)
  if (labeled) {
    const n = parseInt(labeled[1], 10)
    if (n >= 16 && n <= 99) return { age: n, birth_month: null }
  }
  return null
}

// Returns height in inches or null
function parseHeight(s: string): number | null {
  const t = s.trim()
  // "6 1" or "5 11"
  const spaceFormat = t.match(/^([4-7])\s+(\d{1,2})$/)
  if (spaceFormat) {
    const ft = parseInt(spaceFormat[1], 10)
    const inc = parseInt(spaceFormat[2], 10)
    if (inc < 12) return ft * 12 + inc
  }
  // "6'1" or "6'1\"" or "6'11\""
  const apostrophe = t.match(/^([4-7])'(\d{1,2})"?$/)
  if (apostrophe) {
    const ft = parseInt(apostrophe[1], 10)
    const inc = parseInt(apostrophe[2], 10)
    if (inc < 12) return ft * 12 + inc
  }
  // "511" = 5'11"
  const compact = t.match(/^([56])(\d{2})$/)
  if (compact) {
    const ft = parseInt(compact[1], 10)
    const inc = parseInt(compact[2], 10)
    if (inc < 12) return ft * 12 + inc
  }
  // "6 feet 1" or "6 foot 1"
  const worded = t.match(/^([4-7])\s*f(?:eet|oot|t)?\s*(\d{1,2})/)
  if (worded) {
    const ft = parseInt(worded[1], 10)
    const inc = parseInt(worded[2], 10)
    if (inc < 12) return ft * 12 + inc
  }
  return null
}

const MALE_KEYWORDS = ['yeshiva','beis medrash','beis medresh','bmg','mir','lakewood','mesivta',
  'chaim berlin','torah vodaas','ner israel','kollel','chavrusa','gemara','daf yomi','seder']
const FEMALE_KEYWORDS = ['seminary','bais yaakov','by ','bye ','stern college','touro','machon raya',
  'neve yerushalayim','bnos chava','michlalah']

function inferGender(lines: string[]): 'male' | 'female' | null {
  const text = lines.join(' ').toLowerCase()
  const isMale = MALE_KEYWORDS.some(k => text.includes(k))
  const isFemale = FEMALE_KEYWORDS.some(k => text.includes(k))
  if (isMale && !isFemale) return 'male'
  if (isFemale && !isMale) return 'female'
  return null
}

// ─── main parse function ──────────────────────────────────────────────────────

export function parseEvernoteHtml(html: string, sourceFile: string): ParsedSingle {
  const result: ParsedSingle = {
    _id: typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).slice(2),
    _source_file: sourceFile,
    _parse_error: null,
    first_name: '',
    last_name: '',
    gender: null,
    phone: null,
    mother_phone: null,
    father_phone: null,
    age: null,
    birth_month: null,
    dob: null,
    city: null,
    state: null,
    address: null,
    height_inches: null,
    current_yeshiva_seminary: null,
    rebbi: null,
    father_name: null,
    father_occupation: null,
    mother_name: null,
    mother_occupation: null,
    parents_location: null,
    sibling_position: null,
    plans: null,
    looking_for: null,
    eretz_yisroel: null,
    photo_url: null,
    raw_notes: [],
    _is_duplicate: false,
    _duplicate_match: null,
    _skip: false,
  }

  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    // ── Name extraction ──
    const h1 = doc.querySelector('h1')
    const titleEl = doc.querySelector('title')
    const rawName = (h1?.textContent?.trim() || titleEl?.textContent?.trim() || '').replace(/\s+/g, ' ')
    if (rawName) {
      // "Goldstein, Yosef" or "Yosef Goldstein"
      if (rawName.includes(',')) {
        const [last, first] = rawName.split(',').map(s => s.trim())
        result.last_name = last
        result.first_name = first
      } else {
        const parts = rawName.trim().split(/\s+/)
        result.first_name = parts[0] || ''
        result.last_name = parts.slice(1).join(' ')
      }
    }

    // ── Extract text lines ──
    const lines: string[] = []
    const paras = doc.querySelectorAll('.para, div.para')
    if (paras.length > 0) {
      paras.forEach(el => {
        // Handle <br> as newline within a para
        el.querySelectorAll('br').forEach(br => br.replaceWith('\n'))
        const text = el.textContent?.trim()
        if (text) {
          text.split('\n').forEach(l => { const t = l.trim(); if (t) lines.push(t) })
        }
      })
    } else {
      // Fallback: all leaf block elements inside body
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

    // ── Process lines ──
    for (const line of lines) {
      if (!line) continue
      const tl = line.toLowerCase()

      // Skip the name line if it repeated in body
      if (result.first_name && result.last_name) {
        const fullName = `${result.first_name} ${result.last_name}`.toLowerCase()
        if (tl === fullName || tl === `${result.last_name}, ${result.first_name}`.toLowerCase()) continue
      }

      // ── Father line: "F Avraham Goldstein - learning"
      if (/^F\s+[A-Z]/.test(line)) {
        const rest = line.slice(2).trim()
        const dashIdx = rest.search(/\s*[-–—,]\s*/)
        if (dashIdx !== -1) {
          result.father_name = rest.slice(0, dashIdx).trim()
          const afterDash = rest.slice(dashIdx).replace(/^[-–—,\s]+/, '').trim()
          // If afterDash looks like a phone, store it as father_phone
          if (isPhoneLike(afterDash)) {
            result.father_phone = parsePhone(afterDash)
          } else {
            result.father_occupation = afterDash
          }
        } else if (isPhoneLike(rest)) {
          result.father_phone = parsePhone(rest)
        } else {
          result.father_name = rest
        }
        continue
      }

      // ── Mother line: "M Sara Goldstein - teacher"
      if (/^M\s+[A-Z]/.test(line)) {
        const rest = line.slice(2).trim()
        const dashIdx = rest.search(/\s*[-–—,]\s*/)
        if (dashIdx !== -1) {
          result.mother_name = rest.slice(0, dashIdx).trim()
          const afterDash = rest.slice(dashIdx).replace(/^[-–—,\s]+/, '').trim()
          if (isPhoneLike(afterDash)) {
            result.mother_phone = parsePhone(afterDash)
          } else {
            result.mother_occupation = afterDash
          }
        } else if (isPhoneLike(rest)) {
          result.mother_phone = parsePhone(rest)
        } else {
          result.mother_name = rest
        }
        continue
      }

      // ── Parents location: "Parents: Lakewood, NJ" or "Parents' location: ..."
      if (/^[Pp]arents?['s]?\s*(?:location|loc|home)?:?\s*/i.test(line)) {
        result.parents_location = line.replace(/^[Pp]arents?['s]?\s*(?:location|loc|home)?:?\s*/i, '').trim()
        continue
      }

      // ── Rebbi / Rabbi
      if (/^(?:Rebbi|Rabbi|Reb|R')\s+/i.test(line) || /^Rebbi?:?\s*/i.test(line)) {
        result.rebbi = line.replace(/^(?:Rebbi?|Rabbi|Reb|R'):?\s*/i, '').trim() || line
        continue
      }

      // ── EY / Eretz Yisroel
      if (/\b(EY|E\.Y\.|eretz yisroel|eretz israel|israel|ey open|open to ey|year in israel|year in ey)\b/i.test(line)) {
        result.eretz_yisroel = (result.eretz_yisroel ? result.eretz_yisroel + '; ' : '') + line
        continue
      }

      // ── Sibling position: "2 of 5"
      const sibMatch = line.match(/^(\d+)\s+of\s+(\d+)$/i)
      if (sibMatch) {
        result.sibling_position = `${sibMatch[1]} of ${sibMatch[2]}`
        continue
      }

      // ── DOB (full date) — check before age to avoid misidentifying dates as ages
      const dateResult = parseDateString(line)
      if (dateResult) {
        result.dob = dateResult.dob
        continue
      }

      // ── Phone
      if (isPhoneLike(line)) {
        if (!result.phone) result.phone = parsePhone(line)
        else if (!result.mother_phone) result.mother_phone = parsePhone(line)
        else if (!result.father_phone) result.father_phone = parsePhone(line)
        else result.raw_notes.push(line)
        continue
      }

      // ── Height
      const heightInches = parseHeight(line)
      if (heightInches !== null && !result.height_inches) {
        result.height_inches = heightInches
        continue
      }

      // ── Age
      const ageResult = parseAgeLine(line)
      if (ageResult && !result.age) {
        result.age = ageResult.age
        if (ageResult.birth_month) result.birth_month = ageResult.birth_month
        continue
      }

      // ── Plans
      if (/\bplan[s]?\b|\b\d+\s*[Yy]ear\b|\bwork\b.*\blearn\b|\blearn\b.*\bwork\b/i.test(line) && !result.plans) {
        result.plans = (result.plans ? result.plans + '; ' : '') + line
        continue
      }
      if (/^[Pp]lans?:?\s*/i.test(line)) {
        result.plans = line.replace(/^[Pp]lans?:?\s*/i, '').trim() || line
        continue
      }

      // ── Looking for
      if (/^(?:LF|Looking for|Looking for:?|LF:)\s*/i.test(line)) {
        result.looking_for = line.replace(/^(?:LF:?|Looking for:?)\s*/i, '').trim() || line
        continue
      }

      // ── Yeshiva / Seminary
      if (/\b(yeshiva|beis\s*medrash|beis\s*medresh|kollel|bmg|mir|mesivta|seminary|bais\s*yaakov|touro|stern)\b/i.test(line) && !result.current_yeshiva_seminary) {
        result.current_yeshiva_seminary = line
        continue
      }

      // ── City / State  "Brooklyn, NY" or "Brooklyn NY"
      const cityStateMatch = line.match(/^([A-Za-z\s\.]+),?\s+([A-Z]{2})$/)
      if (cityStateMatch && !result.city) {
        result.city = cityStateMatch[1].trim()
        result.state = cityStateMatch[2]
        continue
      }

      // ── Address (contains a number followed by street-like text)
      if (/^\d+\s+[A-Za-z]/.test(line) && !result.address) {
        result.address = line
        continue
      }

      // ── Catch-all → raw_notes
      result.raw_notes.push(line)
    }

    // ── Post-processing: infer gender from all content ──
    if (!result.gender) {
      result.gender = inferGender([
        result.current_yeshiva_seminary ?? '',
        result.eretz_yisroel ?? '',
        ...lines,
      ])
    }

  } catch (err) {
    result._parse_error = err instanceof Error ? err.message : 'Unknown parse error'
  }

  return result
}

// ─── Duplicate detection ──────────────────────────────────────────────────────

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
  } catch {
    return null
  }
}

export function checkDuplicate(
  parsed: ParsedSingle,
  existing: ExistingSingle[]
): { isDuplicate: boolean; matchName: string | null } {
  const fn = parsed.first_name.toLowerCase().trim()
  const ln = parsed.last_name.toLowerCase().trim()

  for (const s of existing) {
    if (s.first_name.toLowerCase().trim() !== fn || s.last_name.toLowerCase().trim() !== ln) continue

    // Name match — now check age proximity (within 1 year)
    const pAge = parsed.age ?? (parsed.dob ? approximateAge(parsed.dob) : null)
    const sAge = s.age ?? (s.dob ? approximateAge(s.dob) : null)

    if (pAge !== null && sAge !== null) {
      if (Math.abs(pAge - sAge) <= 1) {
        return { isDuplicate: true, matchName: `${s.first_name} ${s.last_name}` }
      }
      // Age mismatch > 1 year → probably different person with same name
    } else {
      // Can't confirm age — flag as likely duplicate on name alone
      return { isDuplicate: true, matchName: `${s.first_name} ${s.last_name}` }
    }
  }

  return { isDuplicate: false, matchName: null }
}
