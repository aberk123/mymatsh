import { cn } from '@/lib/utils'
import { type LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon?: LucideIcon
  trend?: { value: number; label: string }
  className?: string
  onClick?: () => void
}

export function StatCard({ label, value, icon: Icon, trend, className, onClick }: StatCardProps) {
  return (
    <div
      className={cn(
        'card flex flex-col gap-3',
        onClick && 'cursor-pointer hover:shadow-card-hover transition-shadow',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-[#555555] font-medium">{label}</span>
        {Icon && (
          <div className="w-9 h-9 rounded-lg bg-[#F8F0F5] flex items-center justify-center">
            <Icon className="h-5 w-5 text-brand-maroon" />
          </div>
        )}
      </div>
      <div>
        <span className="text-3xl font-bold text-[#1A1A1A]">{value}</span>
        {trend && (
          <p className="text-xs text-[#888888] mt-1">
            <span className={trend.value >= 0 ? 'text-green-600' : 'text-red-500'}>
              {trend.value >= 0 ? '+' : ''}{trend.value}%
            </span>{' '}
            {trend.label}
          </p>
        )}
      </div>
    </div>
  )
}
