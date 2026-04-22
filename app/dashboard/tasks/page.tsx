'use client'

import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  Users,
  Heart,
  CalendarCheck,
  MessageSquare,
  UsersRound,
  UserCircle,
  Plus,
  Check,
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { NavItem } from '@/components/ui/sidebar'
import type { TaskType, TaskStatus } from '@/types/database'
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

interface Task {
  id: string
  title: string
  due_date: string
  type: TaskType
  status: TaskStatus
  notes: string | null
  single_id: string | null
  singleName?: string
}

interface SingleOption {
  id: string
  name: string
}

const taskTypeClasses: Record<TaskType, string> = {
  follow_up:      'bg-blue-50 text-blue-700',
  date_scheduled: 'bg-green-50 text-green-700',
  on_hold:        'bg-yellow-50 text-yellow-700',
  note:           'bg-purple-50 text-purple-700',
  other:          'bg-gray-100 text-gray-600',
}

const taskTypeLabels: Record<TaskType, string> = {
  follow_up:      'Follow Up',
  date_scheduled: 'Date',
  on_hold:        'On Hold',
  note:           'Note',
  other:          'Other',
}

const statusBadgeClasses: Record<TaskStatus, string> = {
  pending:     'badge-pending',
  in_progress: 'badge-active',
  on_hold:     'badge-on-hold',
  completed:   'badge-completed',
}

const statusLabels: Record<TaskStatus, string> = {
  pending:     'Pending',
  in_progress: 'In Progress',
  on_hold:     'On Hold',
  completed:   'Completed',
}

type FilterType = 'all' | TaskStatus

export default function TasksPage() {
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<Task[]>([])
  const [singles, setSingles] = useState<SingleOption[]>([])
  const [filter, setFilter] = useState<FilterType>('all')
  const [dialogOpen, setDialogOpen] = useState(false)

  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState<TaskType>('follow_up')
  const [newDueDate, setNewDueDate] = useState('')
  const [newSingleId, setNewSingleId] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (supabase.from('shadchan_profiles') as any)
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle() as { data: { id: string } | null }

      if (!profile) { setLoading(false); return }

      // Load tasks
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: taskRows } = await (supabase.from('calendar_tasks') as any)
        .select('id, title, type, due_date, status, notes, single_id')
        .eq('shadchan_id', profile.id)
        .neq('status', 'completed')
        .order('due_date', { ascending: true }) as {
          data: Array<{ id: string; title: string; type: TaskType; due_date: string; status: TaskStatus; notes: string | null; single_id: string | null }> | null
        }

      // Load completed tasks too
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: completedRows } = await (supabase.from('calendar_tasks') as any)
        .select('id, title, type, due_date, status, notes, single_id')
        .eq('shadchan_id', profile.id)
        .eq('status', 'completed')
        .order('due_date', { ascending: false })
        .limit(10) as {
          data: Array<{ id: string; title: string; type: TaskType; due_date: string; status: TaskStatus; notes: string | null; single_id: string | null }> | null
        }

      const allTasks = [...(taskRows ?? []), ...(completedRows ?? [])]

      // Resolve single names
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: singlesData } = await (supabase.from('singles') as any)
        .select('id, first_name, last_name')
        .eq('created_by_shadchan_id', profile.id) as {
          data: Array<{ id: string; first_name: string; last_name: string }> | null
        }

      const singleNameMap = Object.fromEntries(
        (singlesData ?? []).map((s) => [s.id, `${s.first_name} ${s.last_name}`.trim()])
      )

      setSingles((singlesData ?? []).map((s) => ({ id: s.id, name: `${s.first_name} ${s.last_name}`.trim() })))

      setTasks(allTasks.map((t) => ({
        ...t,
        singleName: t.single_id ? (singleNameMap[t.single_id] ?? undefined) : undefined,
      })))

      setLoading(false)
    }

    load()
  }, [])

  const filteredTasks = filter === 'all'
    ? tasks
    : tasks.filter((t) => t.status === filter)

  async function toggleComplete(id: string) {
    const task = tasks.find((t) => t.id === id)
    if (!task) return
    const newStatus: TaskStatus = task.status === 'completed' ? 'pending' : 'completed'

    const res = await fetch(`/api/dashboard/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })

    if (res.ok) {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t)))
    }
  }

  async function handleSaveTask() {
    if (!newTitle.trim()) return
    setSaving(true)
    setSaveError('')
    try {
      const res = await fetch('/api/dashboard/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          type: newType,
          due_date: newDueDate || new Date().toISOString().split('T')[0],
          notes: newNotes || null,
          single_id: newSingleId || null,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const newTask = await res.json() as { id: string; title: string; type: TaskType; due_date: string; status: TaskStatus; notes: string | null; single_id: string | null }
      const singleName = newTask.single_id
        ? singles.find((s) => s.id === newTask.single_id)?.name
        : undefined
      setTasks((prev) => [...prev, { ...newTask, singleName }])
      setNewTitle('')
      setNewType('follow_up')
      setNewDueDate('')
      setNewSingleId('')
      setNewNotes('')
      setDialogOpen(false)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save task')
    } finally {
      setSaving(false)
    }
  }

  // Build calendar for current month
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = now.getDate()

  const taskDays = new Set(
    tasks
      .filter((t) => {
        if (!t.due_date) return false
        const d = new Date(t.due_date + 'T00:00:00')
        return d.getFullYear() === year && d.getMonth() === month
      })
      .map((t) => new Date(t.due_date + 'T00:00:00').getDate())
  )

  const calendarCells: Array<number | null> = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <AppLayout navItems={navItems} title="Calendar" role="shadchan">
      {loading ? (
        <div className="flex items-center justify-center py-24 text-[#888888] text-sm">Loading…</div>
      ) : (
        <div className="flex flex-col xl:flex-row gap-6">
          {/* Left panel: Task list */}
          <div className="xl:w-1/3 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#1A1A1A]">Tasks</h2>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="btn-primary gap-1.5">
                    <Plus className="h-4 w-4" />
                    Add Task
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Task</DialogTitle>
                  </DialogHeader>
                  <div className="px-6 pb-4 space-y-4">
                    {saveError && (
                      <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">
                        {saveError}
                      </div>
                    )}
                    <div>
                      <Label className="field-label">Title</Label>
                      <Input
                        className="input-base mt-1"
                        placeholder="Task title..."
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="field-label">Type</Label>
                      <select
                        className="input-base mt-1 w-full"
                        value={newType}
                        onChange={(e) => setNewType(e.target.value as TaskType)}
                      >
                        <option value="follow_up">Follow Up</option>
                        <option value="date_scheduled">Date Scheduled</option>
                        <option value="on_hold">On Hold</option>
                        <option value="note">Note</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <Label className="field-label">Due Date</Label>
                      <Input
                        type="date"
                        className="input-base mt-1"
                        value={newDueDate}
                        onChange={(e) => setNewDueDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="field-label">Related Single</Label>
                      <select
                        className="input-base mt-1 w-full"
                        value={newSingleId}
                        onChange={(e) => setNewSingleId(e.target.value)}
                      >
                        <option value="">— None —</option>
                        {singles.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label className="field-label">Notes</Label>
                      <Textarea
                        className="input-base mt-1 resize-none min-h-[80px]"
                        placeholder="Optional notes..."
                        value={newNotes}
                        onChange={(e) => setNewNotes(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="secondary" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
                    <Button className="btn-primary" onClick={handleSaveTask} disabled={!newTitle.trim() || saving}>
                      {saving ? 'Saving…' : 'Save Task'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-1 flex-wrap">
              {(['all', 'pending', 'in_progress', 'completed'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    filter === f ? 'bg-brand-maroon text-white' : 'text-[#555555] hover:bg-gray-100'
                  }`}
                >
                  {f === 'all' ? 'All' : f === 'in_progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {filteredTasks.length === 0 ? (
                <p className="text-sm text-[#888888] text-center py-8">No tasks found.</p>
              ) : (
                filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`card p-3 flex items-start gap-3 ${task.status === 'completed' ? 'opacity-60' : ''}`}
                  >
                    <button
                      onClick={() => toggleComplete(task.id)}
                      className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        task.status === 'completed'
                          ? 'bg-brand-maroon border-brand-maroon'
                          : 'border-gray-300 hover:border-brand-maroon'
                      }`}
                    >
                      {task.status === 'completed' && <Check className="h-3 w-3 text-white" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium leading-snug ${task.status === 'completed' ? 'line-through text-[#888888]' : 'text-[#1A1A1A]'}`}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${taskTypeClasses[task.type]}`}>
                          {taskTypeLabels[task.type]}
                        </span>
                        <span className={`text-xs ${statusBadgeClasses[task.status]}`}>
                          {statusLabels[task.status]}
                        </span>
                        <span className="text-xs text-[#888888]">
                          {new Date(task.due_date + 'T00:00:00').toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric',
                          })}
                        </span>
                      </div>
                      {task.singleName && (
                        <p className="text-xs text-brand-maroon mt-0.5">{task.singleName}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right panel: Calendar */}
          <div className="xl:flex-1">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#1A1A1A]">{monthName}</h3>
                <div className="flex items-center gap-4 text-xs text-[#888888]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-brand-maroon inline-block" />
                    Has task
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-brand-pink inline-block" />
                    Today
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-7 mb-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <div key={d} className="text-xs font-medium text-[#888888] text-center py-1">
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarCells.map((day, i) => {
                  if (day === null) return <div key={`empty-${i}`} />
                  const isToday = day === today
                  const hasTask = taskDays.has(day)
                  return (
                    <div
                      key={day}
                      className={`relative aspect-square rounded-lg flex flex-col items-center justify-center transition-colors ${
                        isToday
                          ? 'bg-brand-pink text-white font-bold'
                          : 'hover:bg-[#F8F0F5] text-[#1A1A1A]'
                      }`}
                    >
                      <span className="text-sm leading-none">{day}</span>
                      {hasTask && !isToday && (
                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-brand-maroon" />
                      )}
                      {hasTask && isToday && (
                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
