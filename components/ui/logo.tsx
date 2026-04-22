'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

interface LogoProps {
  variant?: 'light' | 'sidebar'
  href?: string
  className?: string
}

export function Logo({ variant = 'light', href = '/', className }: LogoProps) {
  const inner = (
    <div className={cn('flex flex-col', className)}>
      <span className="logo-my">my</span>
      <span className={variant === 'sidebar' ? 'logo-matsh-sidebar' : 'logo-matsh'}>
        matSH
      </span>
    </div>
  )

  return (
    <Link href={href} className="inline-block hover:opacity-90 transition-opacity">
      {inner}
    </Link>
  )
}
