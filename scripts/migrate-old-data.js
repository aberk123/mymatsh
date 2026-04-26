// ⚠️  DO NOT COMMIT — contains admin credentials and will write PII to disk
'use strict'

const https  = require('https')
const http   = require('http')
const fs     = require('fs')
const path   = require('path')
const crypto = require('crypto')
const zlib   = require('zlib')

// ---------------------------------------------------------------------------
// Config — extracted from old platform JS bundle
// ---------------------------------------------------------------------------
const API_BASE       = 'https://api.mymatsh.com/api/v1'
const EMAIL          = 'admin.shidduchinstitute@gmail.com'
const PASSWORD       = 'Admin@Shidduch'
const ENCRYPTION_KEY = '12eyi&*#78dhwueop#^28#$%^hs^#&$*'  // 32 bytes → AES-256
const CIPHER_IV      = 'Byri84^#9dj&#6eo'                   // 16 bytes → AES-CBC IV

const OUT_DIR = path.join(__dirname)

// ---------------------------------------------------------------------------
// Crypto helpers — replicates the old platform's encrypt/decrypt functions
// which use: JSON.stringify → gzip → base64 → prepend 16 random chars
//            → AES-256-CBC encrypt → base64 string
// ---------------------------------------------------------------------------
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
function randomStr(len) {
  let s = ''
  for (let i = 0; i < len; i++) s += CHARS[Math.floor(Math.random() * CHARS.length)]
  return s
}

// The old platform's bufferToBase64 converts gzip bytes → binary string → UTF-8 encode → base64.
// The "binary string via UTF-8" path is NOT equivalent to standard binary base64 for bytes > 127.
// We must replicate the same (buggy-but-consistent) encoding so the server can decrypt.
function gzipToBase64(buf) {
  const binaryStr = Array.from(buf).map((b) => String.fromCharCode(b)).join('')
  return Buffer.from(binaryStr, 'utf8').toString('base64')
}

// Inverse: base64 → UTF-8 decode → charCodeAt → Uint8Array
function base64ToGzip(b64) {
  const str   = Buffer.from(b64, 'base64').toString('utf8')
  const bytes = Buffer.allocUnsafe(str.length)
  for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i)
  return bytes
}

function encryptPayload(obj) {
  const json       = JSON.stringify(obj)
  const compressed = zlib.gzipSync(Buffer.from(json, 'utf8'))
  const plaintext  = randomStr(16) + gzipToBase64(compressed)

  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY, 'utf8'),
    Buffer.from(CIPHER_IV, 'utf8')
  )
  return Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]).toString('base64')
}

function decryptResponse(encryptedB64) {
  try {
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(ENCRYPTION_KEY, 'utf8'),
      Buffer.from(CIPHER_IV, 'utf8')
    )
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedB64, 'base64')),
      decipher.final(),
    ]).toString('utf8')

    const b64NoPrefix  = decrypted.slice(16)          // strip 16 random chars
    const decompressed = zlib.gunzipSync(base64ToGzip(b64NoPrefix))
    return JSON.parse(decompressed.toString('utf8'))
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// HTTP helper — no external deps
// ---------------------------------------------------------------------------
function request(url, { method = 'GET', headers = {}, bodyObj } = {}) {
  return new Promise((resolve, reject) => {
    const u   = new URL(url)
    const mod = u.protocol === 'https:' ? https : http

    let bodyStr
    let contentType = 'application/json'
    if (bodyObj !== undefined) {
      const encrypted = encryptPayload(bodyObj)
      bodyStr    = `data=${encodeURIComponent(encrypted)}`
      contentType = 'application/x-www-form-urlencoded'
    }

    const options = {
      hostname: u.hostname,
      port:     u.port || (u.protocol === 'https:' ? 443 : 80),
      path:     u.pathname + u.search,
      method,
      headers: {
        'Content-Type':   contentType,
        'Accept':         'application/json',
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
        ...headers,
      },
    }

    const req = mod.request(options, (res) => {
      let raw = ''
      res.on('data', (c) => (raw += c))
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, raw }))
    })
    req.on('error', reject)
    if (bodyStr) req.write(bodyStr)
    req.end()
  })
}

// Parse a response — parse outer JSON, then decrypt the inner .data field if it's a string
function parseResponse(raw) {
  let outer
  try { outer = JSON.parse(raw) } catch { return raw }

  // API wraps responses as { success, statusCode, data: "ENCRYPTED" }
  if (outer && typeof outer.data === 'string' && outer.data.length > 20) {
    const decrypted = decryptResponse(outer.data)
    if (decrypted !== null) outer.data = decrypted
  }
  return outer
}

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------
async function login() {
  console.log('Logging in…')
  const res  = await request(`${API_BASE}/auth/admin-login`, {
    method:  'POST',
    bodyObj: { email: EMAIL, password: PASSWORD },
  })
  console.log('Login status:', res.status)

  const body = parseResponse(res.raw)

  if (res.status !== 200 && res.status !== 201) {
    console.error('Login failed. Parsed body:', JSON.stringify(body).slice(0, 500))
    throw new Error('Login failed')
  }

  const token =
    body?.token             ||
    body?.data?.token       ||
    body?.accessToken       ||
    body?.access_token      ||
    body?.data?.accessToken ||
    body?.data?.access_token ||
    null

  if (!token) {
    console.error('No token found. Body keys:', JSON.stringify(body).slice(0, 500))
    throw new Error('No token in login response')
  }

  console.log('✓ Login successful\n')
  return token
}

// ---------------------------------------------------------------------------
// Paginated fetch
// ---------------------------------------------------------------------------
async function fetchAll(token, endpoint, label, { pageSize = 100 } = {}) {
  const all  = []
  let offset = 0
  let page   = 1

  while (true) {
    const sep = endpoint.includes('?') ? '&' : '?'
    const url = `${API_BASE}${endpoint}${sep}limit=${pageSize}&offset=${offset}`
    process.stdout.write(`  Fetching ${label} page ${page}… `)

    const res = await request(url, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (res.status === 404) {
      console.log(`404 — endpoint not found`)
      return null
    }
    if (res.status === 401 || res.status === 403) {
      console.log(`${res.status} — auth error. Raw: ${res.raw.slice(0, 200)}`)
      return null
    }
    if (res.status !== 200) {
      console.log(`HTTP ${res.status}. Raw: ${res.raw.slice(0, 200)}`)
      break
    }

    const body = parseResponse(res.raw)

    // Normalise: records might be at body, body.data, body.data.records, body.data.childDetails, etc.
    let records =
      (Array.isArray(body)                      && body)                      ||
      (Array.isArray(body?.data)                && body.data)                ||
      (Array.isArray(body?.data?.records)       && body.data.records)       ||
      (Array.isArray(body?.data?.childDetails)  && body.data.childDetails)  ||
      (Array.isArray(body?.data?.all_childs)    && body.data.all_childs)    ||
      (Array.isArray(body?.data?.professionals) && body.data.professionals) ||
      (Array.isArray(body?.result)              && body.result)              ||
      (Array.isArray(body?.records)             && body.records)             ||
      (Array.isArray(body?.list)                && body.list)                ||
      null

    if (!records) {
      console.log(`\n  ⚠️  Could not find records array.`)
      console.log('  Body keys:', body && typeof body === 'object' ? Object.keys(body).join(', ') : 'N/A')
      console.log('  body.data type:', typeof body?.data, '| isArray:', Array.isArray(body?.data))
      if (body?.data && typeof body.data === 'object' && !Array.isArray(body.data)) {
        console.log('  body.data keys:', Object.keys(body.data).join(', '))
        for (const k of Object.keys(body.data)) {
          const v = body.data[k]
          console.log('    data.' + k + ':', Array.isArray(v) ? '[array len=' + v.length + ']' : (typeof v + ': ' + JSON.stringify(v).slice(0, 80)))
        }
      } else if (typeof body?.data === 'string') {
        console.log('  body.data (not decrypted):', body.data.slice(0, 80))
      }
      break
    }

    console.log(`got ${records.length}`)

    // If this is the first page and we got more records than the page size,
    // the endpoint ignores pagination and returns everything at once — stop here.
    if (page === 1 && records.length > pageSize) {
      all.push(...records)
      break
    }

    all.push(...records)

    const total =
      body?.pagination?.total ||
      body?.pagination?.count ||
      body?.total             ||
      body?.data?.total       ||
      body?.data?.count       ||
      body?.count             ||
      null

    if (records.length < pageSize || (total !== null && all.length >= total)) break
    offset += pageSize
    page++
  }

  console.log(`  ✓ ${label}: ${all.length} total\n`)
  return all
}

// ---------------------------------------------------------------------------
// CSV helpers
// ---------------------------------------------------------------------------
function escapeCSV(val) {
  if (val === null || val === undefined) return ''
  const s = String(val).replace(/"/g, '""')
  return /[",\n\r]/.test(s) ? `"${s}"` : s
}

function toCSV(rows, columns) {
  const header = columns.join(',')
  const lines  = rows.map((r) => columns.map((c) => escapeCSV(r[c])).join(','))
  return [header, ...lines].join('\n')
}

function saveCSV(filename, rows, columns) {
  const filePath = path.join(OUT_DIR, filename)
  fs.writeFileSync(filePath, toCSV(rows, columns), 'utf8')
  console.log(`  → Saved ${rows.length} rows to ${filename}`)
}

// ---------------------------------------------------------------------------
// Field mappers
// ---------------------------------------------------------------------------
function mapShadchan(r) {
  const auth = r.user_auth_detail || {}
  const name = [auth.first_name || r.first_name, auth.last_name || r.last_name].filter(Boolean).join(' ') || r.name || r.username || ''
  return {
    name,
    email:            r.email || auth.email || '',
    phone:            r.phone || auth.phone || r.phoneNumber || '',
    city:             r.city || auth.city || '',
    state:            r.state || auth.state || '',
    years_experience: r.yearsExperience || r.years_experience || r.experience || '',
    bio:              r.bio || r.about || r.description || '',
  }
}

function mapSingle(r) {
  const c = r.child || r
  return {
    first_name:        c.firstName      || c.first_name      || '',
    last_name:         c.lastName       || c.last_name       || '',
    gender:            c.gender         || '',
    email:             c.email          || r.email           || '',
    phone:             c.phone          || r.phone           || '',
    city:              c.city           || c.location?.city  || '',
    state:             c.state          || c.location?.state || '',
    age:               c.age            || '',
    dob:               c.dob            || c.dateOfBirth     || c.date_of_birth || '',
    height_inches:     c.heightInches   || c.height_inches   || c.height        || '',
    hashkafa:          c.hashkafa       || c.religious_level || '',
    plans:             c.plans          || c.future_plans    || '',
    about_me:          c.aboutMe        || c.about_me        || c.about         || '',
    looking_for:       c.lookingFor     || c.looking_for     || '',
    family_background: c.familyBackground || c.family_background || '',
    yeshiva_seminary:  c.yeshivaSeminary  || c.yeshiva          || c.seminary       || '',
    eretz_yisroel:     c.eretzYisroel     || c.eretz_yisroel    || c.israel          || '',
  }
}

function mapParent(r) {
  const childEmails = (r.child_details?.single_child_details || r.children || [])
    .map((c) => c.email || '').filter(Boolean).join(';')
  return {
    first_name:  r.first_name  || r.firstName  || '',
    last_name:   r.last_name   || r.lastName   || '',
    email:       r.email       || '',
    phone:       r.phone       || r.phoneNumber || '',
    city:        r.city        || r.address     || '',
    child_email: childEmails,
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('=== MyMatSH Data Migration ===\n')

  const token = await login()

  // ── Shadchanim ──
  console.log('── Shadchanim ──')
  let shadchanim = await fetchAll(token, '/professional/get-professional', 'shadchanim')
  if (!shadchanim) {
    for (const alt of ['/get-professional', '/professional?type=0', '/professional']) {
      console.log(`  Trying ${alt}…`)
      shadchanim = await fetchAll(token, alt, 'shadchanim')
      if (shadchanim) break
    }
  }
  if (shadchanim?.length) {
    saveCSV('shadchanim.csv', shadchanim.map(mapShadchan), [
      'name', 'email', 'phone', 'city', 'state', 'years_experience', 'bio',
    ])
  } else {
    console.log('  No shadchanim data retrieved.\n')
  }

  // ── Singles ──
  console.log('── Singles ──')
  let singles = await fetchAll(token, '/child/get-all-child', 'singles')
  if (!singles) {
    for (const alt of ['/child', '/child/get-all-singles', '/get-all-singles']) {
      console.log(`  Trying ${alt}…`)
      singles = await fetchAll(token, alt, 'singles')
      if (singles) break
    }
  }
  if (singles?.length) {
    saveCSV('singles.csv', singles.map(mapSingle), [
      'first_name', 'last_name', 'gender', 'email', 'phone', 'city', 'state',
      'age', 'dob', 'height_inches', 'hashkafa', 'plans', 'about_me',
      'looking_for', 'family_background', 'yeshiva_seminary', 'eretz_yisroel',
    ])
  } else {
    console.log('  No singles data retrieved.\n')
  }

  // ── Parents ──
  console.log('── Parents ──')
  let parents = await fetchAll(token, '/parent', 'parents')
  if (!parents) {
    for (const alt of ['/parent/find-parent']) {
      console.log(`  Trying ${alt}…`)
      parents = await fetchAll(token, alt, 'parents')
      if (parents) break
    }
  }
  if (parents?.length) {
    saveCSV('parents.csv', parents.map(mapParent), [
      'first_name', 'last_name', 'email', 'phone', 'city', 'child_email',
    ])
  } else {
    console.log('  No parents data retrieved.\n')
  }

  console.log('=== Done ===')
}

main().catch((err) => {
  console.error('\nFatal error:', err.message)
  process.exit(1)
})
