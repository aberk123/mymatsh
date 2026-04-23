import { cn } from '@/lib/utils'
import { getInitials } from '@/lib/utils'

interface AvatarProps {
  name: string
  imageUrl?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  className?: string
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-xl',
  xl: 'h-32 w-32 text-4xl',
  '2xl': 'h-[120px] w-[120px] text-4xl',
}

export function Avatar({ name, imageUrl, size = 'md', className }: AvatarProps) {
  const sizeClass = sizeClasses[size]

  if (imageUrl) {
    return (
      <div className={cn('rounded-full overflow-hidden flex-shrink-0', sizeClass, className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'avatar-gradient rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white',
        sizeClass,
        className
      )}
    >
      {getInitials(name)}
    </div>
  )
}

interface AvatarCardProps {
  name: string
  subtitle?: string
  imageUrl?: string | null
  className?: string
}

export function AvatarCard({ name, subtitle, imageUrl, className }: AvatarCardProps) {
  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      <div className="avatar-gradient rounded-2xl flex items-center justify-center w-32 h-32 shadow-lg">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={name} className="w-full h-full object-cover rounded-2xl" />
        ) : (
          <span className="text-5xl font-bold text-white">{getInitials(name)}</span>
        )}
      </div>
      <div className="text-center">
        <p className="font-semibold text-[#1A1A1A] text-base">{name}</p>
        {subtitle && <p className="text-sm text-[#555555] mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}
