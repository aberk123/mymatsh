'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Heart,
  CalendarCheck,
  MessageSquare,
  UsersRound,
  UserCircle,
  ChevronLeft,
  Pencil,
  Plus,
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { Avatar } from '@/components/ui/avatar'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { NavItem } from '@/components/ui/sidebar'
import { heightToDisplay } from '@/lib/utils'

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'My Singles', href: '/dashboard/singles', icon: Users },
  { label: 'Suggestions', href: '/dashboard/matches', icon: Heart },
  { label: 'Calendar', href: '/dashboard/tasks', icon: CalendarCheck },
  { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare, badge: '3' },
  { label: 'Groups', href: '/dashboard/groups', icon: UsersRound },
  { label: 'My Profile', href: '/dashboard/profile', icon: UserCircle },
]

const mockSingle = {
  id: '1',
  first_name: 'Yosef',
  last_name: 'Goldstein',
  full_hebrew_name: 'יוסף בן אברהם',
  gender: 'male' as const,
  dob: '1999-03-14',
  age: 26,
  phone: '(718) 555-0142',
  email: 'yosef@example.com',
  address: '456 Ocean Pkwy, Apt 3A',
  city: 'Brooklyn',
  state: 'NY',
  country: 'USA',
  postal_code: '11218',
  height_inches: 71,
  about_bio: "Yosef is a warm, thoughtful young man who values Torah learning and family. He has a great sense of humor and is known in his community for his chesed work. He enjoys learning Gemara b'chavrusa and has a passion for music.",
  current_education: 'Beis Medrash Govoha – Kollel',
  occupation: null,
  high_schools: 'Yeshiva Torah Temimah (2013–2017)',
  eretz_yisroel: '2 years – Mir Yerushalayim',
  current_yeshiva_seminary: 'Beis Medrash Govoha',
  family_background: 'Father is a well-respected Rav in Flatbush. Mother is a principal at a local Bais Yaakov. The family is known for their hospitality and strong community ties. Ashkenaz background, 4th generation American.',
  siblings: '4 siblings – 2 brothers (both in kollel), 2 sisters (one married, one in Bais Yaakov 12th grade)',
  looking_for: 'Someone warm and family-oriented, who values Torah as the center of home life. Looking for a girl with good middos, a sense of humor, and ambition to build a bayis ne\'eman b\'Yisroel.',
  plans: 'Plans to learn in kollel for several years after marriage. Open to eventually entering the rabbinate or Jewish education.',
  hashkafa: 'yeshivish',
  photo_url: null,
  resume_url: null,
  status: 'available' as const,
  pledge_amount: 5000,
}

const mockMatches = [
  { id: 'm1', name: 'Devorah Friedman', status: 'pending', city: 'Lakewood, NJ', date: 'Apr 3, 2026' },
  { id: 'm2', name: 'Rivka Cohen', status: 'going_out', city: 'Monsey, NY', date: 'Mar 20, 2026' },
  { id: 'm3', name: 'Chana Blum', status: 'past', city: 'Baltimore, MD', date: 'Feb 10, 2026' },
]

const mockTasks = [
  { id: 't1', title: 'Follow up – parents spoke', type: 'follow_up', dueDate: 'Apr 22, 2026', status: 'pending' },
  { id: 't2', title: 'Schedule date #2 with Devorah', type: 'date_scheduled', dueDate: 'Apr 24, 2026', status: 'pending' },
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

const hashkafaLabels: Record<string, string> = {
  yeshivish: 'Yeshivish',
  modern_orthodox: 'Modern Orthodox',
  chassidish: 'Chassidish',
  sephardic: 'Sephardic',
  baal_teshuva: 'Baal Teshuva',
  other: 'Other',
}

type Tab = 'profile' | 'matches' | 'tasks' | 'notes'

function FieldRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex gap-3 py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs text-[#888888] w-40 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-[#1A1A1A]">{value || '—'}</span>
    </div>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-maroon mb-2 mt-4 first:mt-0">
      {children}
    </h3>
  )
}

export default function SingleProfilePage() {
  const params = useParams()
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [notes, setNotes] = useState('')
  const [notesSaved, setNotesSaved] = useState(false)

  const single = mockSingle

  const handleSaveNotes = () => {
    console.log('Saving notes:', notes)
    setNotesSaved(true)
    setTimeout(() => setNotesSaved(false), 2000)
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'profile', label: 'Profile' },
    { key: 'matches', label: 'Matches' },
    { key: 'tasks', label: 'Tasks' },
    { key: 'notes', label: 'Notes' },
  ]

  return (
    <AppLayout navItems={navItems} title="Single Profile" role="shadchan">
      {/* Back */}
      <div className="mb-4">
        <Link href="/dashboard/singles" className="inline-flex items-center gap-1.5 text-sm text-[#555555] hover:text-brand-maroon transition-colors">
          <ChevronLeft className="h-4 w-4" />
          Back to My Singles
        </Link>
      </div>

      {/* Header Card */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          <Avatar name={`${single.first_name} ${single.last_name}`} imageUrl={single.photo_url} size="xl" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-[#1A1A1A]">
                  {single.first_name} {single.last_name}
                </h1>
                {single.full_hebrew_name && (
                  <p className="text-base text-[#888888] mt-0.5 font-medium" dir="rtl">
                    {single.full_hebrew_name}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <span className="text-sm text-[#555555]">
                    Age {single.age}
                  </span>
                  <span className="text-[#DDDDDD]">•</span>
                  <span className="text-sm text-[#555555]">
                    {single.city}, {single.state}
                  </span>
                  <span className="text-[#DDDDDD]">•</span>
                  <StatusBadge status={single.status} />
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Link href={`/dashboard/singles/${params.id}/edit`}>
                  <Button variant="secondary" size="sm" className="gap-2">
                    <Pencil className="h-3.5 w-3.5" />
                    Edit Profile
                  </Button>
                </Link>
                <Link href="/dashboard/matches">
                  <Button variant="pink" size="sm" className="gap-2">
                    <Heart className="h-3.5 w-3.5" />
                    Create Match
                  </Button>
                </Link>
                <Link href="/dashboard/tasks">
                  <Button variant="outline-maroon" size="sm" className="gap-2">
                    <Plus className="h-3.5 w-3.5" />
                    Add Task
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card p-0 overflow-hidden">
        <div className="flex border-b border-gray-100">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-brand-pink text-brand-pink'
                  : 'border-transparent text-[#888888] hover:text-[#555555]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div>
                <SectionHeading>Personal Info</SectionHeading>
                <FieldRow label="Date of Birth" value={single.dob} />
                <FieldRow label="Gender" value={single.gender === 'male' ? 'Male' : 'Female'} />
                <FieldRow label="Height" value={single.height_inches ? heightToDisplay(single.height_inches) : null} />
                <FieldRow label="Hashkafa" value={single.hashkafa ? hashkafaLabels[single.hashkafa] ?? single.hashkafa : null} />

                <SectionHeading>Contact</SectionHeading>
                <FieldRow label="Phone" value={single.phone} />
                <FieldRow label="Email" value={single.email} />
                <FieldRow label="Address" value={single.address} />
                <FieldRow label="City / State" value={`${single.city}, ${single.state} ${single.postal_code}`} />
                <FieldRow label="Country" value={single.country} />
              </div>

              {/* Right Column */}
              <div>
                <SectionHeading>Education</SectionHeading>
                <FieldRow label="Current Education" value={single.current_education} />
                <FieldRow label="Occupation" value={single.occupation} />
                <FieldRow label="High Schools" value={single.high_schools} />
                <FieldRow label="Eretz Yisroel" value={single.eretz_yisroel} />
                <FieldRow label="Yeshiva / Seminary" value={single.current_yeshiva_seminary} />

                <SectionHeading>Background</SectionHeading>
                <div className="py-2 border-b border-gray-50">
                  <p className="text-xs text-[#888888] mb-1">Family Background</p>
                  <p className="text-sm text-[#1A1A1A] leading-relaxed">{single.family_background || '—'}</p>
                </div>
                <div className="py-2">
                  <p className="text-xs text-[#888888] mb-1">Siblings</p>
                  <p className="text-sm text-[#1A1A1A]">{single.siblings || '—'}</p>
                </div>
              </div>

              {/* Full width About section */}
              <div className="lg:col-span-2 border-t border-gray-100 pt-4">
                <SectionHeading>About</SectionHeading>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-[#888888] mb-1">Bio</p>
                    <p className="text-sm text-[#1A1A1A] leading-relaxed">{single.about_bio || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#888888] mb-1">Looking For</p>
                    <p className="text-sm text-[#1A1A1A] leading-relaxed">{single.looking_for || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#888888] mb-1">Future Plans</p>
                    <p className="text-sm text-[#1A1A1A] leading-relaxed">{single.plans || '—'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Matches Tab */}
          {activeTab === 'matches' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#1A1A1A]">Matches for {single.first_name}</h3>
                <Link href="/dashboard/matches">
                  <Button variant="pink" size="sm" className="gap-2">
                    <Plus className="h-3.5 w-3.5" />
                    New Match
                  </Button>
                </Link>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="table-th">Name</th>
                    <th className="table-th">Status</th>
                    <th className="table-th">City</th>
                    <th className="table-th">Date Suggested</th>
                  </tr>
                </thead>
                <tbody>
                  {mockMatches.map((match) => (
                    <tr key={match.id} className="table-row">
                      <td className="table-td font-medium text-[#1A1A1A]">{match.name}</td>
                      <td className="table-td">
                        <StatusBadge status={match.status} />
                      </td>
                      <td className="table-td text-[#555555]">{match.city}</td>
                      <td className="table-td text-[#555555]">{match.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#1A1A1A]">Tasks for {single.first_name}</h3>
                <Link href="/dashboard/tasks">
                  <Button variant="outline-maroon" size="sm" className="gap-2">
                    <Plus className="h-3.5 w-3.5" />
                    Add Task
                  </Button>
                </Link>
              </div>
              <div className="space-y-3">
                {mockTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 bg-[#FAFAFA]">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#1A1A1A]">{task.title}</p>
                      <p className="text-xs text-[#888888] mt-0.5">Due: {task.dueDate}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${taskTypeClasses[task.type]}`}>
                      {taskTypeLabels[task.type]}
                    </span>
                    <StatusBadge status={task.status} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === 'notes' && (
            <div>
              <h3 className="font-semibold text-[#1A1A1A] mb-3">Private Notes</h3>
              <p className="text-xs text-[#888888] mb-3">Notes are only visible to you and will not be shared.</p>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={8}
                placeholder="Add private notes about this single here…"
              />
              <div className="mt-3 flex items-center gap-3">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveNotes}
                >
                  Save Notes
                </Button>
                {notesSaved && (
                  <span className="text-xs text-green-600 font-medium">Saved!</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
