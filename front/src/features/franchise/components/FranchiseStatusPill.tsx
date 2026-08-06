import type { ReactNode } from 'react'
import { Badge } from '@/shared/ui/badge'
import { cn } from '@/shared/lib/utils'

type FranchisePillVariant = 'default' | 'secondary' | 'outline' | 'destructive'

export function FranchiseStatusPill({
  variant = 'secondary',
  children,
  className,
}: {
  variant?: FranchisePillVariant
  children: ReactNode
  className?: string
}) {
  return (
    <Badge variant={variant} className={cn('gap-1.5', className)}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {children}
    </Badge>
  )
}
