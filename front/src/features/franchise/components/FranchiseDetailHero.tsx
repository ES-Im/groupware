import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

export function FranchiseDetailHero({
  icon,
  title,
  status,
  meta,
  actions,
  className,
}: {
  icon: ReactNode
  title: ReactNode
  status?: ReactNode
  meta?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-start', className)}>
      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground [&_svg]:size-6">
        {icon}
      </span>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold tracking-tight break-words">{title}</h2>
          {status}
        </div>
        {meta && (
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            {meta}
          </div>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function FranchiseHeroMetaItem({
  icon,
  children,
}: {
  icon?: ReactNode
  children: ReactNode
}) {
  return (
    <span className="inline-flex items-center gap-1.5 [&_svg]:size-3.5 [&_svg]:text-muted-foreground">
      {icon}
      {children}
    </span>
  )
}
