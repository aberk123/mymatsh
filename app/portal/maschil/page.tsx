'use client'

import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  HelpCircle,
  MessageSquare,
  ToggleLeft,
  ToggleRight,
  MessageCircleQuestion,
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { WelcomeBanner } from '@/components/ui/welcome-banner'
import { StatCard } from '@/components/ui/stat-card'
import { EmptyState } from '@/components/ui/empty-state'
import type { NavItem } from '@/components/ui/sidebar'
import { createClient } from '@/lib/supabase/client'

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/portal/maschil', icon: LayoutDashboard },
  { label: 'Profile Questions', href: '/portal/maschil/questions', icon: HelpCircle },
  { label: 'Messages', href: '/portal/maschil/messages', icon: MessageSquare },
]

interface Question {
  id: string
  question: string
  is_active: boolean
  created_at: string
}

export default function MaschiDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [maschiName, setMaschiName] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [toggling, setToggling] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: maschil } = await (supabase.from('maschils') as any)
        .select('full_name')
        .eq('user_id', user.id)
        .maybeSingle() as { data: { full_name: string } | null }

      if (maschil) setMaschiName(maschil.full_name)

      // Load questions
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: qs } = await (supabase.from('profile_questions') as any)
        .select('id, question, is_active, created_at')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })
        .limit(5) as { data: Question[] | null }

      setQuestions(qs ?? [])

      // Unread messages
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count: unread } = await (supabase.from('messages') as any)
        .select('id', { count: 'exact', head: true })
        .eq('to_user_id', user.id)
        .eq('is_read', false) as { count: number | null }

      setUnreadCount(unread ?? 0)
      setLoading(false)
    }

    load()
  }, [])

  async function toggleQuestion(id: string) {
    const q = questions.find((q) => q.id === id)
    if (!q || toggling) return
    setToggling(id)

    const newActive = !q.is_active
    const res = await fetch(`/api/maschil/questions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: newActive }),
    })

    if (res.ok) {
      setQuestions((prev) =>
        prev.map((q) => (q.id === id ? { ...q, is_active: newActive } : q))
      )
    }
    setToggling(null)
  }

  const activeCount = questions.filter((q) => q.is_active).length

  if (loading) {
    return (
      <AppLayout navItems={navItems} title="Maschil Dashboard" role="maschil">
        <div className="flex items-center justify-center py-24 text-[#888888] text-sm">Loading…</div>
      </AppLayout>
    )
  }

  if (!maschiName) {
    return (
      <AppLayout navItems={navItems} title="Maschil Dashboard" role="maschil">
        <EmptyState message="Maschil profile not found. Please contact support." />
      </AppLayout>
    )
  }

  return (
    <AppLayout navItems={navItems} title="Maschil Dashboard" role="maschil">
      <WelcomeBanner
        greeting={`Shalom, ${maschiName}`}
        subtitle="Help guide singles with thoughtful profile questions."
        steps={[
          { number: 1, label: 'Review Questions' },
          { number: 2, label: 'Add New Questions' },
          { number: 3, label: 'Guide Singles' },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <StatCard label="Active Questions" value={activeCount} icon={HelpCircle} />
        <StatCard label="Total Questions" value={questions.length} icon={MessageCircleQuestion} />
        <StatCard label="Unread Messages" value={unreadCount} icon={MessageSquare} />
      </div>

      <div className="card mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#1A1A1A]">My Questions</h3>
          <span className="text-xs text-[#888888] bg-gray-100 px-2 py-0.5 rounded-full">
            {activeCount} active
          </span>
        </div>

        {questions.length === 0 ? (
          <p className="text-sm text-[#888888] text-center py-4">
            No questions yet.{' '}
            <a href="/portal/maschil/questions" className="text-brand-maroon hover:underline">
              Add your first question.
            </a>
          </p>
        ) : (
          <div className="space-y-3">
            {questions.map((q) => (
              <div
                key={q.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-[#FAFAFA] border border-gray-100"
              >
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${q.is_active ? 'text-[#1A1A1A]' : 'text-[#888888]'}`}>
                    {q.question}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs font-medium ${q.is_active ? 'text-green-600' : 'text-[#888888]'}`}>
                    {q.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    onClick={() => toggleQuestion(q.id)}
                    disabled={toggling === q.id}
                    className="text-[#888888] hover:text-brand-maroon transition-colors disabled:opacity-50"
                    aria-label={q.is_active ? 'Deactivate question' : 'Activate question'}
                  >
                    {q.is_active ? (
                      <ToggleRight className="h-6 w-6 text-brand-maroon" />
                    ) : (
                      <ToggleLeft className="h-6 w-6" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
