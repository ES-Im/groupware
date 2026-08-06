import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

interface FranchisePageHeaderProps {
  title: string
  description?: string
  children?: ReactNode
  className?: string
}

export function FranchisePageHeader({
  title,
  description,
  children,
  className,
}: FranchisePageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
    </div>
  )
}
