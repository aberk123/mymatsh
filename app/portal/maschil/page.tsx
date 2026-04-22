'use client'

import { useState } from 'react'
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
import type { NavItem } from '@/components/ui/sidebar'

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/portal/maschil', icon: LayoutDashboard },
  { label: 'Profile Questions', href: '/portal/maschil/questions', icon: HelpCircle },
  { label: 'Messages', href: '/portal/maschil/messages', icon: MessageSquare },
]

const initialQuestions = [
  {
    id: '1',
    question: 'What values are most important to you in a spouse?',
    active: true,
    responses: 18,
  },
  {
    id: '2',
    question: 'How do you envision your Jewish home?',
    active: true,
    responses: 15,
  },
  {
    id: '3',
    question: 'What does a typical Shabbos look like in your ideal home?',
    active: true,
    responses: 12,
  },
  {
    id: '4',
    question: 'How important is continued Torah learning after marriage?',
    active: true,
    responses: 20,
  },
  {
    id: '5',
    question: 'Describe your relationship with your parents and family.',
    active: false,
    responses: 8,
  },
]

export default function MaschiDashboardPage() {
  const [questions, setQuestions] = useState(initialQuestions)

  function toggleQuestion(id: string) {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, active: !q.active } : q))
    )
  }

  const activeCount = questions.filter((q) => q.active).length

  return (
    <AppLayout navItems={navItems} title="Maschil Dashboard" role="maschil">
      <WelcomeBanner
        greeting="Shalom, Rabbi Friedman"
        subtitle="Help guide singles with thoughtful profile questions."
        steps={[
          { number: 1, label: 'Review Questions' },
          { number: 2, label: 'Add New Questions' },
          { number: 3, label: 'Guide Singles' },
        ]}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <StatCard label="Active Questions" value={12} icon={HelpCircle} />
        <StatCard label="Responses This Month" value={34} icon={MessageCircleQuestion} />
        <StatCard label="Pending Review" value={3} icon={MessageSquare} />
      </div>

      {/* My Active Questions */}
      <div className="card mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#1A1A1A]">My Active Questions</h3>
          <span className="text-xs text-[#888888] bg-gray-100 px-2 py-0.5 rounded-full">
            {activeCount} active
          </span>
        </div>
        <div className="space-y-3">
          {questions.map((q) => (
            <div
              key={q.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-[#FAFAFA] border border-gray-100"
            >
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${q.active ? 'text-[#1A1A1A]' : 'text-[#888888]'}`}>
                  {q.question}
                </p>
                <p className="text-xs text-[#888888] mt-0.5">{q.responses} responses</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-xs font-medium ${q.active ? 'text-green-600' : 'text-[#888888]'}`}>
                  {q.active ? 'Active' : 'Inactive'}
                </span>
                <button
                  onClick={() => toggleQuestion(q.id)}
                  className="text-[#888888] hover:text-brand-maroon transition-colors"
                  aria-label={q.active ? 'Deactivate question' : 'Activate question'}
                >
                  {q.active ? (
                    <ToggleRight className="h-6 w-6 text-brand-maroon" />
                  ) : (
                    <ToggleLeft className="h-6 w-6" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}
