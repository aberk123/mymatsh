'use client'

import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type SingleStatus } from '@/types/database'

const statusClasses: Record<string, string> = {
  available: 'badge-available',
  engaged: 'badge-engaged',
  married: 'badge-engaged',
  draft: 'badge-draft',
  on_hold: 'badge-on-hold',
  inactive: 'badge-inactive',
  completed: 'badge-completed',
  active: 'badge-active',
  pending: 'badge-pending',
  verified: 'badge-active',
  public: 'badge-public',
  private: 'badge-private',
}

const statusLabels: Record<string, string> = {
  available: 'Available',
  engaged: 'Engaged',
  married: 'Married',
  draft: 'Draft',
  on_hold: 'On Hold',
  inactive: 'Inactive',
  completed: 'Completed',
  active: 'Active',
  pending: 'Pending',
  verified: 'Verified',
  public: 'Public',
  private: 'Private',
}

interface StatusBadgeProps {
  status: string
  className?: string
  showDropdown?: boolean
  onStatusChange?: (newStatus: SingleStatus) => void
}

const singleStatuses: SingleStatus[] = [
  'available',
  'draft',
  'on_hold',
  'engaged',
  'married',
  'inactive',
]

export function StatusBadge({
  status,
  className,
  showDropdown = false,
  onStatusChange,
}: StatusBadgeProps) {
  const badgeClass = statusClasses[status] ?? 'badge-pending'
  const label = statusLabels[status] ?? status

  if (showDropdown && onStatusChange) {
    return (
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            className={cn(badgeClass, 'cursor-pointer hover:opacity-80 transition-opacity', className)}
          >
            {label}
            <ChevronDown className="h-3 w-3 ms-1" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="z-50 min-w-[140px] rounded-lg border border-gray-200 bg-white shadow-lg py-1"
            sideOffset={4}
          >
            {singleStatuses.map((s) => (
              <DropdownMenu.Item
                key={s}
                className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
                onSelect={() => onStatusChange(s)}
              >
                <StatusBadge status={s} />
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    )
  }

  return (
    <span className={cn(badgeClass, className)}>
      {label}
    </span>
  )
}

interface RoleBadgeProps {
  role: string
  className?: string
}

const roleLabels: Record<string, string> = {
  platform_admin: 'Super Admin',
  shadchan: 'Shadchan',
  single: 'Single',
  parent: 'Parent',
  advocate: 'Advocate',
  maschil: 'Maschil',
  org_admin: 'Org Admin',
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  return (
    <span className={cn('badge-pink', className)}>
      {roleLabels[role] ?? role}
    </span>
  )
}
