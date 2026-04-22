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

interface Group {
  id: string
  name: string
  visibility: GroupVisibility
  memberCount: number
  created_at: string
  isMine: boolean
}

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
          {group.memberCount} member{group.memberCount !== 1 ? 's' : ''} · Created{' '}
          {new Date(group.created_at).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
          })}
        </p>
      </div>
    </div>
  )
}

export default function GroupsPage() {
  const [loading, setLoading] = useState(true)
  const [profileId, setProfileId] = useState('')
  const [groups, setGroups] = useState<Group[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newVisibility, setNewVisibility] = useState<GroupVisibility>('public')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

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
      setProfileId(profile.id)

      // My groups (created by me)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: myGroups } = await (supabase.from('groups') as any)
        .select('id, name, visibility, created_at')
        .eq('created_by', profile.id)
        .order('created_at', { ascending: false }) as {
          data: Array<{ id: string; name: string; visibility: GroupVisibility; created_at: string }> | null
        }

      // Other groups I'm a member of (but not creator)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: memberRows } = await (supabase.from('group_members') as any)
        .select('group_id')
        .eq('shadchan_id', profile.id) as { data: Array<{ group_id: string }> | null }

      const memberGroupIds = (memberRows ?? []).map((r) => r.group_id)
      const myGroupIds = new Set((myGroups ?? []).map((g) => g.id))
      const otherGroupIds = memberGroupIds.filter((id) => !myGroupIds.has(id))

      let otherGroups: Array<{ id: string; name: string; visibility: GroupVisibility; created_at: string }> = []
      if (otherGroupIds.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: og } = await (supabase.from('groups') as any)
          .select('id, name, visibility, created_at')
          .in('id', otherGroupIds) as {
            data: Array<{ id: string; name: string; visibility: GroupVisibility; created_at: string }> | null
          }
        otherGroups = og ?? []
      }

      // Count members for all groups
      const allGroupIds = [
        ...(myGroups ?? []).map((g) => g.id),
        ...otherGroups.map((g) => g.id),
      ]

      const memberCounts: Record<string, number> = {}
      if (allGroupIds.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: members } = await (supabase.from('group_members') as any)
          .select('group_id')
          .in('group_id', allGroupIds) as { data: Array<{ group_id: string }> | null }

        for (const m of members ?? []) {
          memberCounts[m.group_id] = (memberCounts[m.group_id] ?? 0) + 1
        }
      }

      const result: Group[] = [
        ...(myGroups ?? []).map((g) => ({ ...g, isMine: true, memberCount: memberCounts[g.id] ?? 1 })),
        ...otherGroups.map((g) => ({ ...g, isMine: false, memberCount: memberCounts[g.id] ?? 1 })),
      ]

      setGroups(result)
      setLoading(false)
    }

    load()
  }, [])

  const myGroups = groups.filter((g) => g.isMine)
  const otherGroups = groups.filter((g) => !g.isMine)

  async function handleCreate() {
    if (!newName.trim() || !profileId) return
    setCreating(true)
    setCreateError('')
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), visibility: newVisibility }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const newGroup = await res.json() as { id: string; name: string; visibility: GroupVisibility; created_at: string }
      setGroups((prev) => [{ ...newGroup, isMine: true, memberCount: 1 }, ...prev])
      setNewName('')
      setNewVisibility('public')
      setDialogOpen(false)
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create group')
    } finally {
      setCreating(false)
    }
  }

  return (
    <AppLayout navItems={navItems} title="Groups" role="shadchan">
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
              {createError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">
                  {createError}
                </div>
              )}
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
              <Button variant="secondary" onClick={() => setDialogOpen(false)} disabled={creating}>Cancel</Button>
              <Button
                className="btn-primary"
                onClick={handleCreate}
                disabled={!newName.trim() || creating}
              >
                {creating ? 'Creating…' : 'Create Group'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-[#888888] text-sm">Loading…</div>
      ) : (
        <>
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
        </>
      )}
    </AppLayout>
  )
}
