#!/usr/bin/env node
/**
 * Creates the platform_admin (Super Admin) account.
 * Uses the Supabase service role key — no DB password needed.
 * Run: npm run db:seed
 */
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load .env.local
const envPath = join(__dirname, '../.env.local')
const envLines = readFileSync(envPath, 'utf8').split('\n')
for (const line of envLines) {
  const match = line.match(/^([^#\s][^=]*)=(.+)$/)
  if (match) process.env[match[1].trim()] = match[2].trim()
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const EMAIL = 'ari@thevoiceoflakewood.com'
const PASSWORD = 'Admin2026!'

console.log('⏳ Creating Super Admin auth account...')

let userId
const { data: created, error: createError } = await supabase.auth.admin.createUser({
  email: EMAIL,
  password: PASSWORD,
  email_confirm: true,
})

if (createError) {
  const msg = createError.message?.toLowerCase() ?? ''
  if (msg.includes('already') || createError.status === 422) {
    console.log('   Auth user already exists — fetching and updating password...')
    const { data: listData, error: listErr } = await supabase.auth.admin.listUsers()
    if (listErr) { console.error('❌', listErr.message); process.exit(1) }
    const existing = listData.users.find(u => u.email === EMAIL)
    if (!existing) { console.error('❌ Could not find existing user'); process.exit(1) }
    userId = existing.id
    const { error: updateErr } = await supabase.auth.admin.updateUserById(userId, {
      password: PASSWORD,
      email_confirm: true,
    })
    if (updateErr) { console.error('❌', updateErr.message); process.exit(1) }
    console.log('   ✓ Password updated for existing auth user')
  } else {
    console.error('❌ Auth error:', createError.message)
    process.exit(1)
  }
} else {
  userId = created.user.id
  console.log('   ✓ Auth user created:', userId)
}

console.log('⏳ Upserting into public.users...')

const { error: upsertErr } = await supabase
  .from('users')
  .upsert({ id: userId, email: EMAIL, role: 'platform_admin', status: 'active' }, { onConflict: 'id' })

if (upsertErr) {
  if (upsertErr.message?.includes('does not exist') || upsertErr.code === '42P01') {
    console.error(`
❌ Table "users" does not exist — run migrations first:

   npm run db:migrate

Then add your database password to .env.local:
   SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@db.nvckmmnnbvptprgonsyg.supabase.co:5432/postgres

Get the password: Supabase Dashboard → Settings → Database
`)
  } else {
    console.error('❌ DB error:', upsertErr.message, upsertErr.details ?? '')
  }
  process.exit(1)
}

console.log(`
✅ Super Admin ready!
   Email:    ${EMAIL}
   Password: ${PASSWORD}
   Role:     platform_admin
   Auth ID:  ${userId}
`)
