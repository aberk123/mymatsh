'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Users,
  Heart,
  CalendarCheck,
  MessageSquare,
  UsersRound,
  UserCircle,
  ArrowLeft,
  Search,
  X,
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { NavItem } from '@/components/ui/sidebar'
import { createClient } from '@/lib/supabase/client'

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'My Singles', href: '/dashboard/singles', icon: Users },
  { label: 'Suggestions', href: '/dashboard/matches', icon: Heart },
  { label: 'Calendar', href: '/dashboard/tasks', icon: CalendarCheck },
  { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
  { label: 'Groups', href: '/dashboard/groups', icon: UsersRound },
  { label: 'My Profile', href: '/dashboard/profile', icon: UserCircle },
]

interface SingleOption {
  id: string
  name: string
  age: number
  city: string
  hashkafa: string
}

function SingleSearchField({
  label,
  options,
  selected,
  onSelect,
  onClear,
  disabled,
}: {
  label: string
  options: SingleOption[]
  selected: SingleOption | null
  onSelect: (s: SingleOption) => void
  onClear: () => void
  disabled?: boolean
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const filtered = options.filter((o) =>
    o.name.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div>
      <Label className="field-label">{label}</Label>
      {selected ? (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-brand-maroon/30 bg-[#FBF5F9] mt-1">
          <div className="flex-1">
            <p className="text-sm font-medium text-[#1A1A1A]">{selected.name}</p>
            <p className="text-xs text-[#888888]">{selected.age} · {selected.city} · {selected.hashkafa}</p>
          </div>
          <button onClick={onClear} className="text-[#888888] hover:text-[#1A1A1A] transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="relative mt-1">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#888888]" />
            <Input
              className="input-base ps-9"
              placeholder={`Search ${label.toLowerCase()}...`}
              value={query}
              disabled={disabled}
              onChange={(e) => {
                setQuery(e.target.value)
                setOpen(true)
              }}
              onFocus={() => setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 150)}
            />
          </div>
          {open && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
              {filtered.length === 0 ? (
                <p className="text-sm text-[#888888] px-3 py-4 text-center">No results found</p>
              ) : (
                filtered.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className="w-full text-start px-4 py-3 hover:bg-[#F8F0F5] transition-colors border-b border-gray-50 last:border-0"
                    onMouseDown={() => {
                      onSelect(opt)
                      setQuery('')
                      setOpen(false)
                    }}
                  >
                    <p className="text-sm font-medium text-[#1A1A1A]">{opt.name}</p>
                    <p className="text-xs text-[#888888]">{opt.age} · {opt.city} · {opt.hashkafa}</p>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function NewMatchPage() {
  const router = useRouter()
  const [maleSingles, setMaleSingles] = useState<SingleOption[]>([])
  const [femaleSingles, setFemaleSingles] = useState<SingleOption[]>([])
  const [loadingSingles, setLoadingSingles] = useState(true)
  const [selectedBoy, setSelectedBoy] = useState<SingleOption | null>(null)
  const [selectedGirl, setSelectedGirl] = useState<SingleOption | null>(null)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoadingSingles(false); return }

      // Get shadchan profile ID
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (supabase.from('shadchan_profiles') as any)
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle() as { data: { id: string } | null }

      if (!profile) { setLoadingSingles(false); return }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: singles } = await (supabase.from('singles') as any)
        .select('id, first_name, last_name, age, city, state, hashkafa, gender')
        .eq('created_by_shadchan_id', profile.id)
        .in('status', ['available', 'draft'])
        .order('first_name', { ascending: true }) as {
          data: Array<{
            id: string
            first_name: string
            last_name: string
            age: number | null
            city: string | null
            state: string | null
            hashkafa: string | null
            gender: string
          }> | null
        }

      const mapped = (singles ?? []).map((s) => ({
        id: s.id,
        name: `${s.first_name} ${s.last_name}`.trim(),
        age: s.age ?? 0,
        city: [s.city, s.state].filter(Boolean).join(', ') || '—',
        hashkafa: s.hashkafa ?? '—',
        gender: s.gender,
      }))

      setMaleSingles(mapped.filter((s) => s.gender === 'male'))
      setFemaleSingles(mapped.filter((s) => s.gender === 'female'))
      setLoadingSingles(false)
    }
    load()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedBoy || !selectedGirl) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boy_id: selectedBoy.id,
          girl_id: selectedGirl.id,
          notes: notes.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const json = await res.json()
        setSubmitError(json.error ?? 'Failed to create suggestion.')
        return
      }
      router.push('/dashboard/matches')
    } catch {
      setSubmitError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppLayout navItems={navItems} title="New Suggestion" role="shadchan">
      <div className="mb-6">
        <Link
          href="/dashboard/matches"
          className="inline-flex items-center gap-1.5 text-sm text-[#555555] hover:text-brand-maroon transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Suggestions
        </Link>
      </div>

      <div className="max-w-2xl">
        <h2 className="text-2xl font-bold text-[#1A1A1A] mb-1">New Suggestion</h2>
        <p className="text-sm text-[#555555] mb-6">Create a new shidduch suggestion by selecting a boy and girl from your singles.</p>

        {submitError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="card space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">B</span>
                Select Boy
              </h3>
              <SingleSearchField
                label="Boy"
                options={maleSingles}
                selected={selectedBoy}
                onSelect={setSelectedBoy}
                onClear={() => setSelectedBoy(null)}
                disabled={loadingSingles}
              />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-pink-100 text-pink-700 text-xs font-bold flex items-center justify-center">G</span>
                Select Girl
              </h3>
              <SingleSearchField
                label="Girl"
                options={femaleSingles}
                selected={selectedGirl}
                onSelect={setSelectedGirl}
                onClear={() => setSelectedGirl(null)}
                disabled={loadingSingles}
              />
            </div>

            <div>
              <Label htmlFor="notes" className="field-label">Notes</Label>
              <Textarea
                id="notes"
                className="input-base mt-1 min-h-[100px] resize-none"
                placeholder="Add a note about this suggestion..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
              <Link href="/dashboard/matches">
                <Button type="button" variant="secondary">Cancel</Button>
              </Link>
              <Button
                type="submit"
                className="btn-primary"
                disabled={!selectedBoy || !selectedGirl || submitting}
              >
                {submitting ? 'Creating…' : 'Create Suggestion'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}
