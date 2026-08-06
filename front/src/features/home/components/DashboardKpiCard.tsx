import type { ReactNode } from 'react'
import { Card } from '@/shared/ui/card'
import { cn } from '@/shared/lib/utils'

export type DashboardKpiAccent = 'primary' | 'muted' | 'destructive'

interface DashboardKpiCardProps {
  label: string
  value: number | string
  unit?: string
  sub?: string
  icon?: ReactNode
  accent?: DashboardKpiAccent
}

const ICON_TONE: Record<DashboardKpiAccent, string> = {
  primary: 'bg-muted text-foreground',
  muted: 'bg-muted text-muted-foreground',
  destructive: 'bg-destructive/10 text-destructive',
}

export function DashboardKpiCard({
  label,
  value,
  unit,
  sub,
  icon,
  accent = 'primary',
}: DashboardKpiCardProps) {
  return (
    <Card className="h-full">
      {icon && (
        <div className="px-(--card-spacing)">
          <span
            className={cn(
              'grid size-10 place-items-center rounded-xl [&_svg]:size-5',
              ICON_TONE[accent],
            )}
          >
            {icon}
          </span>
        </div>
      )}
      <div className="px-(--card-spacing)">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 text-3xl leading-none font-bold tracking-tight tabular-nums">
          {value}
          {unit && <span className="ml-1 text-sm font-semibold text-muted-foreground">{unit}</span>}
        </p>
        {sub && <p className="mt-2 text-xs text-muted-foreground">{sub}</p>}
      </div>
    </Card>
  )
}
