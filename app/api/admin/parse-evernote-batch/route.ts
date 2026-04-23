import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/database'
import type { ParsedSingle } from '@/lib/utils/evernote-parser'

async function requireAdmin() {
  const cookieStore = await cookies()
  const caller = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cs) { try { cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch { /* */ } },
      },
    }
  )
  const { data: { user } } = await caller.auth.getUser()
  if (!user) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: row } = await caller.from('users' as any).select('role').eq('id', user.id).maybeSingle() as { data: { role: string } | null }
  if (row?.role !== 'platform_admin') return null
  return user
}

interface NoteInput {
  id: string
  source_file: string
  title: string
  text: string
}

interface AiParsedFields {
  first_name?: string | null
  last_name?: string | null
  gender?: string | null
  phone?: string | null
  mother_phone?: string | null
  father_phone?: string | null
  age?: number | null
  birth_month?: string | null
  dob?: string | null
  city?: string | null
  state?: string | null
  address?: string | null
  height_inches?: number | null
  current_yeshiva_seminary?: string | null
  previous_yeshivos?: string | null
  rebbi?: string | null
  father_name?: string | null
  father_occupation?: string | null
  mother_name?: string | null
  mother_occupation?: string | null
  parents_location?: string | null
  sibling_position?: string | null
  plans?: string | null
  eretz_yisroel?: string | null
  hashkafa?: string | null
  looking_for?: string | null
  about_me?: string | null
  family_background?: string | null
  out_of_town?: string | null
  parse_confidence?: 'high' | 'medium' | 'low' | null
  raw_notes?: string | null
}

const PARSE_PROMPT = `You are parsing a shadchan's (Jewish matchmaker's) handwritten notes about multiple singles (unmarried people). Extract all information from each note into a structured JSON array. The notes may be inconsistent, use abbreviations, or mix formats. Return exactly one JSON object per note in the same order they were provided.

For each note extract these fields:
- first_name (string)
- last_name (string)
- gender (string: "male" or "female" — infer from context if not stated)
- phone (string: his/her own phone number)
- mother_phone (string)
- father_phone (string)
- age (integer)
- birth_month (string)
- dob (string: full date if present, ISO format YYYY-MM-DD)
- city (string)
- state (string)
- address (string)
- height_inches (integer: convert all formats to total inches — "6 1" = 73, "5'9" = 69, "69" = 69)
- current_yeshiva_seminary (string)
- previous_yeshivos (string: comma separated list)
- rebbi (string)
- father_name (string)
- father_occupation (string)
- mother_name (string)
- mother_occupation (string)
- parents_location (string)
- sibling_position (string: e.g. "3 of 7")
- plans (string: learning and work plans)
- eretz_yisroel (string: openness to living or starting in Eretz Yisroel)
- hashkafa (string: e.g. yeshivish, modern orthodox, chassidish)
- looking_for (string: what they want in a match)
- about_me (string: personality description)
- family_background (string)
- out_of_town (string: openness to out of town shidduchim)
- parse_confidence (string: "high", "medium", or "low" — your confidence in the overall parse quality)
- raw_notes (string: any information you could not confidently assign to a specific field above — never discard any information from the original note)

Rules:
- "F " at the start of a line means Father
- "M " at the start of a line means Mother
- Heights like "6 1" mean 6 feet 1 inch = 73 inches total
- Common abbreviations: EY = Eretz Yisroel, BMG = Beth Medrash Govoha (major Lakewood yeshiva), BP = Boro Park, TV = Torah Vodaas, YU = Yeshiva University
- If a field is not present return null for that field
- Never invent or assume information not present in the notes
- Parse each note completely independently — do not let information from one note influence another
- Return ONLY a valid JSON array with no explanation, no markdown, no code fences
- The array must contain exactly the same number of objects as notes provided, in the same order`

function buildPromptContent(notes: NoteInput[]): string {
  const noteParts = notes.map((n, i) => {
    const header = n.title ? `[Title: ${n.title}]\n` : ''
    return `[Note ${i + 1}]\n${header}${n.text}`
  })
  return `${PARSE_PROMPT}\n\nNotes to parse (each note is separated by ---NOTE_SEPARATOR---):\n\n${noteParts.join('\n---NOTE_SEPARATOR---\n')}`
}

function nameFromTitle(title: string): { first: string; last: string } {
  if (!title) return { first: '', last: '' }
  if (title.includes(',')) {
    const [l, f] = title.split(',').map(s => s.trim())
    return { first: f ?? '', last: l ?? '' }
  }
  const parts = title.trim().split(/\s+/)
  return { first: parts[0] ?? '', last: parts.slice(1).join(' ') }
}

function extractPhonesFromText(text: string): string[] {
  const matches = text.match(/[\d\s\-\.\(\)\+]{10,16}/g) ?? []
  const phones: string[] = []
  for (const m of matches) {
    const digits = m.replace(/\D/g, '')
    if (digits.length >= 10 && digits.length <= 11) phones.push(m.trim())
  }
  return phones.filter((p, i) => phones.indexOf(p) === i)
}

function buildFallbackRecords(notes: NoteInput[]): ParsedSingle[] {
  return notes.map(n => {
    const { first, last } = nameFromTitle(n.title)
    const phones = extractPhonesFromText(n.text)
    return {
      _id: n.id,
      _source_file: n.source_file,
      _parse_error: 'AI parse failed — manual review required',
      _skip: false,
      _is_duplicate: false,
      _duplicate_match: null,
      parse_method: 'failed' as const,
      parse_confidence: 'low' as const,
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
      raw_notes: n.text ? n.text.split('\n').filter(Boolean) : [],
    }
  })
}

function mapAiResult(ai: AiParsedFields, note: NoteInput): ParsedSingle {
  // Name fallback: if AI didn't extract, try from title
  const { first: titleFirst, last: titleLast } = nameFromTitle(note.title)
  return {
    _id: note.id,
    _source_file: note.source_file,
    _parse_error: null,
    _skip: false,
    _is_duplicate: false,
    _duplicate_match: null,
    parse_method: 'ai',
    parse_confidence: (ai.parse_confidence as 'high' | 'medium' | 'low') ?? 'medium',
    first_name: (ai.first_name?.trim() ?? '') || titleFirst,
    last_name: (ai.last_name?.trim() ?? '') || titleLast,
    gender: (ai.gender as 'male' | 'female' | null) ?? null,
    phone: ai.phone ?? null,
    mother_phone: ai.mother_phone ?? null,
    father_phone: ai.father_phone ?? null,
    age: typeof ai.age === 'number' ? ai.age : null,
    birth_month: ai.birth_month ?? null,
    dob: ai.dob ?? null,
    city: ai.city ?? null,
    state: ai.state ?? null,
    address: ai.address ?? null,
    height_inches: typeof ai.height_inches === 'number' ? ai.height_inches : null,
    current_yeshiva_seminary: ai.current_yeshiva_seminary ?? null,
    previous_yeshivos: ai.previous_yeshivos ?? null,
    rebbi: ai.rebbi ?? null,
    eretz_yisroel: ai.eretz_yisroel ?? null,
    hashkafa: ai.hashkafa ?? null,
    father_name: ai.father_name ?? null,
    father_occupation: ai.father_occupation ?? null,
    mother_name: ai.mother_name ?? null,
    mother_occupation: ai.mother_occupation ?? null,
    parents_location: ai.parents_location ?? null,
    sibling_position: ai.sibling_position ?? null,
    family_background: ai.family_background ?? null,
    plans: ai.plans ?? null,
    looking_for: ai.looking_for ?? null,
    about_me: ai.about_me ?? null,
    out_of_town: ai.out_of_town ?? null,
    photo_url: null,
    raw_notes: ai.raw_notes ? ai.raw_notes.split('\n').filter(Boolean) : [],
  }
}

async function callClaudeForBatch(
  client: Anthropic,
  notes: NoteInput[],
  model: string,
  maxTokens: number
): Promise<{ records: ParsedSingle[]; inputTokens: number; outputTokens: number }> {
  const promptText = buildPromptContent(notes)

  const message = await client.messages.create({
    model,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: promptText }],
  })

  const inputTokens = message.usage.input_tokens
  const outputTokens = message.usage.output_tokens

  const rawText = message.content
    .filter(b => b.type === 'text')
    .map(b => (b as { type: 'text'; text: string }).text)
    .join('')
    .trim()

  const parsed: AiParsedFields[] = JSON.parse(rawText)

  if (!Array.isArray(parsed) || parsed.length !== notes.length) {
    throw new Error(`Expected ${notes.length} results, got ${parsed.length}`)
  }

  return {
    records: parsed.map((ai, i) => mapAiResult(ai, notes[i])),
    inputTokens,
    outputTokens,
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAdmin()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json() as { notes: NoteInput[] }
    if (!Array.isArray(body.notes) || body.notes.length === 0) {
      return NextResponse.json({ error: 'notes array required' }, { status: 400 })
    }

    const model = process.env.AI_PARSE_MODEL ?? 'claude-sonnet-4-20250514'
    const maxTokens = parseInt(process.env.AI_PARSE_MAX_TOKENS ?? '4000', 10)

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

    let records: ParsedSingle[]
    let inputTokens = 0
    let outputTokens = 0

    try {
      const result = await callClaudeForBatch(client, body.notes, model, maxTokens)
      records = result.records
      inputTokens = result.inputTokens
      outputTokens = result.outputTokens
    } catch {
      // One retry after 2 seconds
      await new Promise(r => setTimeout(r, 2000))
      try {
        const result = await callClaudeForBatch(client, body.notes, model, maxTokens)
        records = result.records
        inputTokens = result.inputTokens
        outputTokens = result.outputTokens
      } catch {
        records = buildFallbackRecords(body.notes)
      }
    }

    return NextResponse.json({ records, inputTokens, outputTokens })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
