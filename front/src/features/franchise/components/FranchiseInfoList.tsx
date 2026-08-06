import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

export interface FranchiseInfoItem {
  label: string
  value: ReactNode
  mono?: boolean
}

export function FranchiseInfoList({
  items,
  className,
}: {
  items: FranchiseInfoItem[]
  className?: string
}) {
  return (
    <dl className={cn('flex flex-col', className)}>
      {items.map((item) => (
        <div
          key={item.label}
          className="grid grid-cols-[96px_1fr] items-start gap-3 border-b border-border py-2.5 last:border-0"
        >
          <dt className="text-xs font-medium text-muted-foreground">{item.label}</dt>
          <dd className={cn('text-sm break-words', item.mono && 'font-mono text-[13px]')}>
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
