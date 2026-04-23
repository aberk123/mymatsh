'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard,
  Users,
  Heart,
  CalendarCheck,
  MessageSquare,
  UsersRound,
  UserCircle,
  Plus,
  ChevronRight,
  Eye,
  Pencil,
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { WelcomeBanner } from '@/components/ui/welcome-banner'
import { StatCard } from '@/components/ui/stat-card'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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

const taskTypeClasses: Record<string, string> = {
  follow_up: 'bg-blue-50 text-blue-700',
  date_scheduled: 'bg-green-50 text-green-700',
  on_hold: 'bg-yellow-50 text-yellow-700',
  note: 'bg-purple-50 text-purple-700',
  other: 'bg-gray-100 text-gray-600',
}

const taskTypeLabels: Record<string, string> = {
  follow_up: 'Follow Up',
  date_scheduled: 'Date',
  on_hold: 'On Hold',
  note: 'Note',
  other: 'Other',
}

interface SingleRow {
  id: string
  first_name: string
  last_name: string
  gender: string
  age: number | null
  status: string
  city: string | null
  state: string | null
}

interface TaskRow {
  id: string
  title: string
  type: string
  due_date: string
}

export default function DashboardPage() {
  const [shadchanName, setShadchanName] = useState('')
  const [singlesCount, setSinglesCount] = useState(0)
  const [activeMatchesCount, setActiveMatchesCount] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)
  const [tasksDueCount, setTasksDueCount] = useState(0)
  const [recentSingles, setRecentSingles] = useState<SingleRow[]>([])
  const [upcomingTasks, setUpcomingTasks] = useState<TaskRow[]>([])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (supabase.from('shadchan_profiles') as any)
        .select('id, full_name')
        .eq('user_id', user.id)
        .maybeSingle() as { data: { id: string; full_name: string } | null }

      if (profile?.full_name) setShadchanName(profile.full_name)

      if (!profile) return

      // Recent singles
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: singles } = await (supabase.from('singles') as any)
        .select('id, first_name, last_name, gender, age, status, city, state')
        .eq('created_by_shadchan_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(5) as { data: SingleRow[] | null }

      setRecentSingles(singles ?? [])

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count: totalSingles } = await (supabase.from('singles') as any)
        .select('id', { count: 'exact', head: true })
        .eq('created_by_shadchan_id', profile.id) as { count: number | null }

      setSinglesCount(totalSingles ?? 0)

      // Active matches
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count: activeMatches } = await (supabase.from('matches') as any)
        .select('id', { count: 'exact', head: true })
        .eq('shadchan_id', profile.id)
        .in('status', ['pending', 'current', 'going_out']) as { count: number | null }

      setActiveMatchesCount(activeMatches ?? 0)

      // Unread messages
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count: unread } = await (supabase.from('messages') as any)
        .select('id', { count: 'exact', head: true })
        .eq('to_user_id', user.id)
        .eq('is_read', false) as { count: number | null }

      setUnreadCount(unread ?? 0)

      // Upcoming tasks (due within 7 days)
      const today = new Date()
      const inSevenDays = new Date(today)
      inSevenDays.setDate(inSevenDays.getDate() + 7)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: tasks } = await (supabase.from('calendar_tasks') as any)
        .select('id, title, type, due_date')
        .eq('shadchan_id', profile.id)
        .neq('status', 'completed')
        .lte('due_date', inSevenDays.toISOString().split('T')[0])
        .order('due_date', { ascending: true })
        .limit(5) as { data: TaskRow[] | null }

      setUpcomingTasks(tasks ?? [])

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count: todayTasks } = await (supabase.from('calendar_tasks') as any)
        .select('id', { count: 'exact', head: true })
        .eq('shadchan_id', profile.id)
        .neq('status', 'completed')
        .lte('due_date', today.toISOString().split('T')[0]) as { count: number | null }

      setTasksDueCount(todayTasks ?? 0)
    }
    load()
  }, [])

  function formatTaskDue(dateStr: string) {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const due = new Date(dateStr + 'T00:00:00')
    const todayStr = today.toDateString()
    const tomorrowStr = tomorrow.toDateString()
    if (due.toDateString() === todayStr) return 'Today'
    if (due.toDateString() === tomorrowStr) return 'Tomorrow'
    return due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <AppLayout navItems={navItems} title="Dashboard" role="shadchan">
      <WelcomeBanner
        greeting={shadchanName ? `Welcome back, ${shadchanName.split(' ')[0]}` : 'Welcome back'}
        subtitle="Here's what's happening with your singles today."
        steps={[
          { number: 1, label: 'Add Singles' },
          { number: 2, label: 'Create Suggestions' },
          { number: 3, label: 'Track Progress' },
        ]}
      />

      <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4 mt-6">
        <StatCard label="My Singles" value={singlesCount} icon={Users} />
        <StatCard label="Active Suggestions" value={activeMatchesCount} icon={Heart} />
        <StatCard label="Tasks Due" value={tasksDueCount} icon={CalendarCheck} />
        <StatCard label="Unread Messages" value={unreadCount} icon={MessageSquare} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6 mt-6">
        <div className="xl:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#1A1A1A]">Recent Singles</h3>
            <Link href="/dashboard/singles">
              <Button variant="ghost" size="sm" className="gap-1 text-brand-maroon">
                View All <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
          {recentSingles.length === 0 ? (
            <div className="py-8 text-center text-sm text-[#888888]">
              No singles yet.{' '}
              <Link href="/dashboard/singles/new" className="text-brand-maroon hover:underline">Add your first single.</Link>
            </div>
          ) : (
            <>
              {/* Mobile: card list */}
              <div className="md:hidden space-y-2">
                {recentSingles.map((single) => (
                  <Link key={single.id} href={`/dashboard/singles/${single.id}`} className="block p-3 rounded-xl border border-gray-100 hover:border-brand-maroon/30 hover:bg-[#FBF5F9] transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#1A1A1A] truncate">{single.first_name} {single.last_name}</p>
                        <p className="text-xs text-[#888888] mt-0.5 capitalize">
                          {single.gender}{single.age ? ` · Age ${single.age}` : ''}{[single.city, single.state].filter(Boolean).length > 0 ? ` · ${[single.city, single.state].filter(Boolean).join(', ')}` : ''}
                        </p>
                      </div>
                      <StatusBadge status={single.status} />
                    </div>
                  </Link>
                ))}
              </div>
              {/* Desktop: table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="table-th">Name</th>
                      <th className="table-th">Gender</th>
                      <th className="table-th">Age</th>
                      <th className="table-th">Status</th>
                      <th className="table-th">City</th>
                      <th className="table-th">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSingles.map((single) => (
                      <tr key={single.id} className="table-row">
                        <td className="table-td font-medium text-[#1A1A1A]">{single.first_name} {single.last_name}</td>
                        <td className="table-td text-[#555555] capitalize">{single.gender}</td>
                        <td className="table-td text-[#555555]">{single.age ?? '—'}</td>
                        <td className="table-td"><StatusBadge status={single.status} /></td>
                        <td className="table-td text-[#555555]">{[single.city, single.state].filter(Boolean).join(', ') || '—'}</td>
                        <td className="table-td">
                          <div className="flex items-center gap-1">
                            <Link href={`/dashboard/singles/${single.id}`}>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                            <Link href={`/dashboard/singles/${single.id}/edit`}>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#1A1A1A]">Upcoming Tasks</h3>
            <Link href="/dashboard/tasks">
              <Button variant="ghost" size="sm" className="gap-1 text-brand-maroon">
                View All <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
          {upcomingTasks.length === 0 ? (
            <p className="text-sm text-[#888888] py-4 text-center">No upcoming tasks.</p>
          ) : (
            <div className="space-y-3">
              {upcomingTasks.slice(0, 3).map((task) => (
                <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg bg-[#FAFAFA] border border-gray-100">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1A1A1A] leading-snug">{task.title}</p>
                    <p className="text-xs text-[#888888] mt-0.5">{formatTaskDue(task.due_date)}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${taskTypeClasses[task.type] ?? taskTypeClasses.other}`}>
                    {taskTypeLabels[task.type] ?? 'Task'}
                  </span>
                </div>
              ))}
              {upcomingTasks.length > 3 && (
                <Link href="/dashboard/tasks" className="block text-center text-xs text-brand-maroon hover:underline pt-1">
                  See all {upcomingTasks.length} tasks →
                </Link>
              )}
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Link href="/dashboard/tasks">
              <Button variant="outline-maroon" size="sm" className="w-full gap-2">
                <Plus className="h-3.5 w-3.5" />
                Add Task
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
