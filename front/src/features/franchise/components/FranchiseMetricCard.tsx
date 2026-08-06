import type { ReactNode } from 'react'
import { Card } from '@/shared/ui/card'
import { cn } from '@/shared/lib/utils'

export type FranchiseMetricAccent = 'primary' | 'muted' | 'destructive'

interface FranchiseMetricCardProps {
  title: string
  value: string
  description?: string
  icon?: ReactNode
  accent?: FranchiseMetricAccent
  className?: string
}

const ACCENT_BAR: Record<FranchiseMetricAccent, string> = {
  primary: 'bg-primary',
  muted: 'bg-border',
  destructive: 'bg-destructive/60',
}

const ICON_TONE: Record<FranchiseMetricAccent, string> = {
  primary: 'bg-muted text-foreground',
  muted: 'bg-muted text-muted-foreground',
  destructive: 'bg-destructive/10 text-destructive',
}

export function FranchiseMetricCard({
  title,
  value,
  description,
  icon,
  accent = 'primary',
  className,
}: FranchiseMetricCardProps) {
  return (
    <Card className={cn('relative h-full pt-5', className)}>
      <span aria-hidden className={cn('absolute inset-x-0 top-0 h-1', ACCENT_BAR[accent])} />
      <div className="flex items-start justify-between gap-3 px-(--card-spacing)">
        <div className="min-w-0">
          <span className="inline-flex w-fit rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {title}
          </span>
          <p className="mt-3 truncate text-2xl leading-tight font-semibold tabular-nums">{value}</p>
          {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
        </div>
        {icon && (
          <span
            className={cn(
              'grid size-10 shrink-0 place-items-center rounded-full [&_svg]:size-5',
              ICON_TONE[accent],
            )}
          >
            {icon}
          </span>
        )}
      </div>
    </Card>
  )
}
