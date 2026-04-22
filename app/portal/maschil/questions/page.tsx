'use client'

import { useState } from 'react'
import {
  LayoutDashboard,
  HelpCircle,
  MessageSquare,
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  X,
  Check,
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { EmptyState } from '@/components/ui/empty-state'
import type { NavItem } from '@/components/ui/sidebar'

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
  responses: number
}

const initialQuestions: Question[] = [
  {
    id: '1',
    question: 'What values are most important to you in a spouse?',
    is_active: true,
    created_at: 'Jan 5, 2026',
    responses: 18,
  },
  {
    id: '2',
    question: 'How do you envision your Jewish home?',
    is_active: true,
    created_at: 'Jan 5, 2026',
    responses: 15,
  },
  {
    id: '3',
    question: 'What does a typical Shabbos look like in your ideal home?',
    is_active: true,
    created_at: 'Jan 10, 2026',
    responses: 12,
  },
  {
    id: '4',
    question: 'How important is continued Torah learning after marriage?',
    is_active: true,
    created_at: 'Jan 10, 2026',
    responses: 20,
  },
  {
    id: '5',
    question: 'Describe your relationship with your parents and family.',
    is_active: false,
    created_at: 'Feb 1, 2026',
    responses: 8,
  },
  {
    id: '6',
    question: 'What does a meaningful Yom Tov look like to you?',
    is_active: true,
    created_at: 'Feb 15, 2026',
    responses: 10,
  },
  {
    id: '7',
    question: 'How do you handle conflict or disagreement?',
    is_active: true,
    created_at: 'Mar 1, 2026',
    responses: 14,
  },
  {
    id: '8',
    question: 'What role does tzedakah and chesed play in your life?',
    is_active: false,
    created_at: 'Mar 20, 2026',
    responses: 6,
  },
]

interface QuestionDialogProps {
  open: boolean
  initial?: Question | null
  onClose: () => void
  onSave: (text: string, active: boolean) => void
}

function QuestionDialog({ open, initial, onClose, onSave }: QuestionDialogProps) {
  const [text, setText] = useState(initial?.question ?? '')
  const [active, setActive] = useState(initial?.is_active ?? true)

  if (!open) return null

  function handleSave() {
    if (!text.trim()) return
    onSave(text.trim(), active)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-[#1A1A1A]">
            {initial ? 'Edit Question' : 'Add New Question'}
          </h2>
          <button onClick={onClose} className="text-[#888888] hover:text-[#1A1A1A] transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="question-text" className="field-label">
            Question
          </Label>
          <Textarea
            id="question-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter your question here..."
            rows={4}
            className="input-base resize-none"
          />
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-[#FAFAFA] border border-gray-100">
          <div>
            <p className="text-sm font-medium text-[#1A1A1A]">Active</p>
            <p className="text-xs text-[#888888]">Singles will see this question on their profile</p>
          </div>
          <button
            onClick={() => setActive((a) => !a)}
            className="text-[#888888] hover:text-brand-maroon transition-colors"
          >
            {active ? (
              <ToggleRight className="h-7 w-7 text-brand-maroon" />
            ) : (
              <ToggleLeft className="h-7 w-7" />
            )}
          </button>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="secondary" size="md" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleSave}
            disabled={!text.trim()}
            className="flex-1 gap-1.5"
          >
            <Check className="h-4 w-4" />
            {initial ? 'Save Changes' : 'Add Question'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function MaschiQuestionsPage() {
  const [questions, setQuestions] = useState(initialQuestions)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)

  function handleOpenAdd() {
    setEditingQuestion(null)
    setDialogOpen(true)
  }

  function handleOpenEdit(q: Question) {
    setEditingQuestion(q)
    setDialogOpen(true)
  }

  function handleClose() {
    setDialogOpen(false)
    setEditingQuestion(null)
  }

  function handleSave(text: string, active: boolean) {
    if (editingQuestion) {
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === editingQuestion.id ? { ...q, question: text, is_active: active } : q
        )
      )
    } else {
      const newQ: Question = {
        id: String(Date.now()),
        question: text,
        is_active: active,
        created_at: 'Apr 21, 2026',
        responses: 0,
      }
      setQuestions((prev) => [newQ, ...prev])
    }
    handleClose()
  }

  function handleToggle(id: string) {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, is_active: !q.is_active } : q))
    )
  }

  function handleDelete(id: string) {
    setQuestions((prev) => prev.filter((q) => q.id !== id))
  }

  return (
    <AppLayout navItems={navItems} title="Profile Questions" role="maschil">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-[#555555]">
          Manage the questions shown to singles when building their profile.
        </p>
        <Button variant="primary" size="sm" onClick={handleOpenAdd} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add Question
        </Button>
      </div>

      {questions.length === 0 ? (
        <EmptyState message="No questions yet. Add your first question to get started." />
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="table-th w-full">Question</th>
                  <th className="table-th whitespace-nowrap">Status</th>
                  <th className="table-th whitespace-nowrap">Created</th>
                  <th className="table-th text-center whitespace-nowrap">Responses</th>
                  <th className="table-th text-center whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q) => (
                  <tr key={q.id} className="table-row">
                    <td className="table-td max-w-xs">
                      <p className={`font-medium leading-snug ${q.is_active ? 'text-[#1A1A1A]' : 'text-[#888888]'}`}>
                        {q.question}
                      </p>
                    </td>
                    <td className="table-td whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                          q.is_active
                            ? 'bg-green-50 text-green-700'
                            : 'bg-gray-100 text-[#888888]'
                        }`}
                      >
                        {q.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="table-td text-[#888888] whitespace-nowrap">{q.created_at}</td>
                    <td className="table-td text-center">
                      <span className="font-medium text-[#555555]">{q.responses}</span>
                    </td>
                    <td className="table-td">
                      <div className="flex items-center justify-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleOpenEdit(q)}
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <button
                          onClick={() => handleToggle(q.id)}
                          className="p-1 rounded-md text-[#888888] hover:text-brand-maroon hover:bg-gray-100 transition-colors"
                          title={q.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {q.is_active ? (
                            <ToggleRight className="h-5 w-5 text-brand-maroon" />
                          ) : (
                            <ToggleLeft className="h-5 w-5" />
                          )}
                        </button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(q.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <QuestionDialog
        open={dialogOpen}
        initial={editingQuestion}
        onClose={handleClose}
        onSave={handleSave}
      />
    </AppLayout>
  )
}
