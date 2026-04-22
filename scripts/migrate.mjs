#!/usr/bin/env node
/**
 * Runs Supabase migrations against the remote database.
 * Requires SUPABASE_DB_URL in .env.local (direct PostgreSQL connection string).
 * Run: npm run db:migrate
 */
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import pkg from 'pg'

const { Client } = pkg
const __dirname = dirname(fileURLToPath(import.meta.url))

// Load .env.local
const envPath = join(__dirname, '../.env.local')
const envLines = readFileSync(envPath, 'utf8').split('\n')
for (const line of envLines) {
  const match = line.match(/^([^#\s][^=]*)=(.+)$/)
  if (match) process.env[match[1].trim()] = match[2].trim()
}

const dbUrl = process.env.SUPABASE_DB_URL
if (!dbUrl) {
  console.error(`
❌ SUPABASE_DB_URL not set in .env.local

Add your Supabase database connection string:
   SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@db.nvckmmnnbvptprgonsyg.supabase.co:5432/postgres

Get the password: Supabase Dashboard → Settings → Database → Database password

Or use the SQL Editor in the Supabase Dashboard to run the files manually:
   supabase/migrations/001_initial_schema.sql
   supabase/migrations/002_rls_policies.sql
`)
  process.exit(1)
}

const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })
await client.connect()
console.log('✓ Connected to database')

// Check if schema is already applied
const { rows } = await client.query(`SELECT to_regclass('public.users') AS tbl`)
if (rows[0].tbl) {
  console.log('✓ Schema already exists — skipping 001_initial_schema.sql')
} else {
  console.log('⏳ Applying 001_initial_schema.sql...')
  const schema = readFileSync(join(__dirname, '../supabase/migrations/001_initial_schema.sql'), 'utf8')
  await client.query(schema)
  console.log('✓ Applied 001_initial_schema.sql')
}

// Check if RLS policies are applied (look for a known policy)
const { rows: policyRows } = await client.query(`
  SELECT 1 FROM pg_policies WHERE policyname = 'users_select_own' LIMIT 1
`)
if (policyRows.length > 0) {
  console.log('✓ RLS policies already exist — skipping 002_rls_policies.sql')
} else {
  console.log('⏳ Applying 002_rls_policies.sql...')
  const rls = readFileSync(join(__dirname, '../supabase/migrations/002_rls_policies.sql'), 'utf8')
  await client.query(rls)
  console.log('✓ Applied 002_rls_policies.sql')
}

await client.end()
console.log('\n✅ Migrations complete\n')
