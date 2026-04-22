import { cn } from '@/lib/utils'

interface EmptyStateProps {
  message?: string
  className?: string
}

export function EmptyState({
  message = 'No Data Found',
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('empty-state', className)}>
      {/* Orange envelope illustration */}
      <div className="relative mb-4">
        <svg
          width="80"
          height="64"
          viewBox="0 0 80 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="opacity-80"
        >
          <rect width="80" height="64" rx="6" fill="#FFA726" />
          <path d="M8 16l32 24 32-24" stroke="#E65100" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="8" y1="16" x2="8" y2="52" stroke="#E65100" strokeWidth="2" />
          <line x1="72" y1="16" x2="72" y2="52" stroke="#E65100" strokeWidth="2" />
          <line x1="8" y1="52" x2="72" y2="52" stroke="#E65100" strokeWidth="2" />
        </svg>
        <div className="absolute -top-2 -end-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
          0
        </div>
      </div>
      <p className="text-brand-pink font-medium text-sm">{message}</p>
    </div>
  )
}
