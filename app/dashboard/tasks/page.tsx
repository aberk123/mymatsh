'use client'

import { useState } from 'react'
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

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'My Singles', href: '/dashboard/singles', icon: Users },
  { label: 'Suggestions', href: '/dashboard/matches', icon: Heart },
  { label: 'Calendar', href: '/dashboard/tasks', icon: CalendarCheck },
  { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare, badge: '3' },
  { label: 'Groups', href: '/dashboard/groups', icon: UsersRound },
  { label: 'My Profile', href: '/dashboard/profile', icon: UserCircle },
]

interface Task {
  id: string
  title: string
  dueDate: string
  dueDay: number   // day of April 2026
  type: TaskType
  status: TaskStatus
  relatedSingle: string
}

const mockTasks: Task[] = [
  { id: '1', title: 'Follow up with Yosef Goldstein',        dueDate: 'Apr 21, 2026', dueDay: 21, type: 'follow_up',      status: 'pending',     relatedSingle: 'Yosef Goldstein'   },
  { id: '2', title: 'Schedule date – Devorah & Shmuel',      dueDate: 'Apr 22, 2026', dueDay: 22, type: 'date_scheduled', status: 'pending',     relatedSingle: 'Devorah Friedman'  },
  { id: '3', title: "Check in with Rivka's parents",         dueDate: 'Apr 23, 2026', dueDay: 23, type: 'follow_up',      status: 'in_progress', relatedSingle: 'Rivka Blum'        },
  { id: '4', title: 'Review résumé – Menachem Katz',         dueDate: 'Apr 25, 2026', dueDay: 25, type: 'note',           status: 'pending',     relatedSingle: 'Menachem Katz'     },
  { id: '5', title: 'Chana Levine on hold – revisit',        dueDate: 'May 1, 2026',  dueDay: 0,  type: 'on_hold',        status: 'on_hold',     relatedSingle: 'Chana Levine'      },
  { id: '6', title: 'Add references for Aryeh Rosenblatt',   dueDate: 'Apr 28, 2026', dueDay: 28, type: 'other',          status: 'pending',     relatedSingle: 'Aryeh Rosenblatt'  },
]

const mockSingles = [
  'Yosef Goldstein', 'Devorah Friedman', 'Shmuel Weiss', 'Rivka Blum',
  'Menachem Katz', 'Chana Levine', 'Aryeh Rosenblatt',
]

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

// April 2026: starts on Wednesday (day index 3 in Sun-start), 30 days
const APRIL_START_DOW = 3  // 0=Sun, 3=Wed
const APRIL_DAYS = 30
const TODAY = 21

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks)
  const [filter, setFilter] = useState<FilterType>('all')
  const [dialogOpen, setDialogOpen] = useState(false)

  // New task form state
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState<TaskType>('follow_up')
  const [newDueDate, setNewDueDate] = useState('')
  const [newSingle, setNewSingle] = useState('')
  const [newNotes, setNewNotes] = useState('')

  const filteredTasks = filter === 'all'
    ? tasks
    : tasks.filter((t) => t.status === filter)

  function toggleComplete(id: string) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' }
          : t
      )
    )
  }

  function handleSaveTask() {
    if (!newTitle.trim()) return
    const newTask: Task = {
      id: String(Date.now()),
      title: newTitle,
      dueDate: newDueDate || 'TBD',
      dueDay: 0,
      type: newType,
      status: 'pending',
      relatedSingle: newSingle,
    }
    setTasks((prev) => [...prev, newTask])
    setNewTitle('')
    setNewType('follow_up')
    setNewDueDate('')
    setNewSingle('')
    setNewNotes('')
    setDialogOpen(false)
  }

  // Days with tasks in April
  const taskDays = new Set(tasks.filter((t) => t.dueDay > 0).map((t) => t.dueDay))

  // Build calendar grid: leading blanks + days
  const calendarCells: Array<number | null> = [
    ...Array(APRIL_START_DOW).fill(null),
    ...Array.from({ length: APRIL_DAYS }, (_, i) => i + 1),
  ]

  return (
    <AppLayout navItems={navItems} title="Calendar" role="shadchan">
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Left panel: Task list */}
        <div className="xl:w-1/3 space-y-4">
          {/* Header */}
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
                      value={newSingle}
                      onChange={(e) => setNewSingle(e.target.value)}
                    >
                      <option value="">— None —</option>
                      {mockSingles.map((s) => (
                        <option key={s} value={s}>{s}</option>
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
                  <Button variant="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button className="btn-primary" onClick={handleSaveTask}>Save Task</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filter */}
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

          {/* Task list */}
          <div className="space-y-2">
            {filteredTasks.length === 0 ? (
              <p className="text-sm text-[#888888] text-center py-8">No tasks found.</p>
            ) : (
              filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className={`card p-3 flex items-start gap-3 ${task.status === 'completed' ? 'opacity-60' : ''}`}
                >
                  {/* Checkbox */}
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
                      <span className="text-xs text-[#888888]">{task.dueDate}</span>
                    </div>
                    {task.relatedSingle && (
                      <p className="text-xs text-brand-maroon mt-0.5">{task.relatedSingle}</p>
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
            {/* Month header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#1A1A1A]">April 2026</h3>
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

            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 mb-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="text-xs font-medium text-[#888888] text-center py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarCells.map((day, i) => {
                if (day === null) {
                  return <div key={`empty-${i}`} />
                }
                const isToday = day === TODAY
                const hasTask = taskDays.has(day)

                return (
                  <div
                    key={day}
                    className={`relative aspect-square rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
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
    </AppLayout>
  )
}
