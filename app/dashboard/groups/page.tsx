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
  Eye,
  Lock,
  Globe,
} from 'lucide-react'
import { AppLayout } from '@/components/ui/app-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { NavItem } from '@/components/ui/sidebar'
import type { GroupVisibility } from '@/types/database'

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'My Singles', href: '/dashboard/singles', icon: Users },
  { label: 'Suggestions', href: '/dashboard/matches', icon: Heart },
  { label: 'Calendar', href: '/dashboard/tasks', icon: CalendarCheck },
  { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare, badge: '3' },
  { label: 'Groups', href: '/dashboard/groups', icon: UsersRound },
  { label: 'My Profile', href: '/dashboard/profile', icon: UserCircle },
]

interface Group {
  id: string
  name: string
  visibility: GroupVisibility
  memberCount: number
  createdAt: string
  isMine: boolean
}

const initialGroups: Group[] = [
  { id: '1', name: 'Lakewood Singles Network',       visibility: 'public',  memberCount: 48, createdAt: 'Jan 10, 2026',  isMine: true  },
  { id: '2', name: 'Modern Orthodox Tristate',        visibility: 'public',  memberCount: 32, createdAt: 'Feb 5, 2026',   isMine: true  },
  { id: '3', name: 'Chassidish Connections — Closed', visibility: 'private', memberCount: 12, createdAt: 'Mar 1, 2026',   isMine: true  },
  { id: '4', name: 'NY Shadchanim Collaborative',     visibility: 'public',  memberCount: 67, createdAt: 'Dec 20, 2025',  isMine: false },
  { id: '5', name: 'Out-of-Town Singles Group',       visibility: 'private', memberCount: 19, createdAt: 'Mar 15, 2026',  isMine: false },
]

function VisibilityBadge({ visibility }: { visibility: GroupVisibility }) {
  if (visibility === 'public') {
    return (
      <span className="inline-flex items-center gap-1 badge-public">
        <Globe className="h-3 w-3" />
        Public
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 badge-private">
      <Lock className="h-3 w-3" />
      Private
    </span>
  )
}

function GroupCard({ group }: { group: Group }) {
  return (
    <div className="card flex items-start gap-4">
      <div className="w-12 h-12 rounded-xl bg-[#F8F0F5] flex items-center justify-center flex-shrink-0">
        <UsersRound className="h-6 w-6 text-brand-maroon" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <p className="font-semibold text-[#1A1A1A] leading-snug">{group.name}</p>
          <VisibilityBadge visibility={group.visibility} />
        </div>
        <p className="text-xs text-[#888888] mt-1">
          {group.memberCount} member{group.memberCount !== 1 ? 's' : ''} · Created {group.createdAt}
        </p>
      </div>
      <Button variant="secondary" size="sm" className="flex-shrink-0 gap-1.5">
        <Eye className="h-3.5 w-3.5" />
        View
      </Button>
    </div>
  )
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>(initialGroups)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newVisibility, setNewVisibility] = useState<GroupVisibility>('public')

  const myGroups = groups.filter((g) => g.isMine)
  const otherGroups = groups.filter((g) => !g.isMine)

  function handleCreate() {
    if (!newName.trim()) return
    const group: Group = {
      id: String(Date.now()),
      name: newName.trim(),
      visibility: newVisibility,
      memberCount: 1,
      createdAt: 'Apr 21, 2026',
      isMine: true,
    }
    setGroups((prev) => [group, ...prev])
    setNewName('')
    setNewVisibility('public')
    setDialogOpen(false)
  }

  return (
    <AppLayout navItems={navItems} title="Groups" role="shadchan">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#1A1A1A]">Groups</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-primary gap-2">
              <Plus className="h-4 w-4" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Create New Group</DialogTitle>
            </DialogHeader>
            <div className="px-6 pb-4 space-y-4">
              <div>
                <Label className="field-label">Group Name</Label>
                <Input
                  className="input-base mt-1"
                  placeholder="e.g. Brooklyn Modern Orthodox"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div>
                <Label className="field-label">Visibility</Label>
                <select
                  className="input-base mt-1 w-full"
                  value={newVisibility}
                  onChange={(e) => setNewVisibility(e.target.value as GroupVisibility)}
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button className="btn-primary" onClick={handleCreate} disabled={!newName.trim()}>
                Create Group
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* My Groups */}
      <section className="mb-8">
        <h3 className="text-sm font-semibold text-[#555555] uppercase tracking-wide mb-3">
          My Groups ({myGroups.length})
        </h3>
        {myGroups.length === 0 ? (
          <p className="text-sm text-[#888888]">You have not created any groups yet.</p>
        ) : (
          <div className="space-y-3">
            {myGroups.map((g) => <GroupCard key={g.id} group={g} />)}
          </div>
        )}
      </section>

      {/* Other Groups */}
      <section>
        <h3 className="text-sm font-semibold text-[#555555] uppercase tracking-wide mb-3">
          Other Groups ({otherGroups.length})
        </h3>
        {otherGroups.length === 0 ? (
          <p className="text-sm text-[#888888]">No other groups to display.</p>
        ) : (
          <div className="space-y-3">
            {otherGroups.map((g) => <GroupCard key={g.id} group={g} />)}
          </div>
        )}
      </section>
    </AppLayout>
  )
}
