import type { ReactNode } from 'react'
import { Users } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

export type StatusTone = 'green' | 'slate' | 'indigo'

const toneStyles: Record<StatusTone, string> = {
  green:
    'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-400/20',
  slate: 'bg-muted text-muted-foreground ring-border',
  indigo: 'bg-primary/10 text-primary ring-primary/20',
}

const dotStyles: Record<StatusTone, string> = {
  green: 'bg-emerald-500',
  slate: 'bg-muted-foreground/60',
  indigo: 'bg-primary',
}

export function StatusPill({
  tone = 'green',
  children,
  className,
}: {
  tone?: StatusTone
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ring-1 ring-inset',
        toneStyles[tone],
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', dotStyles[tone])} />
      {children}
    </span>
  )
}

export function CountPill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary',
        className,
      )}
    >
      {children}
    </span>
  )
}

export function meetingInitials(name: string): string {
  return name.replace(/[^가-힣A-Za-z]/g, '').slice(0, 2) || '—'
}

export function InitialAvatar({
  name,
  size = 'sm',
  className,
}: {
  name: string
  size?: 'sm' | 'md'
  className?: string
}) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary',
        size === 'md' ? 'size-9 text-xs' : 'size-7 text-[10px]',
        className,
      )}
    >
      {meetingInitials(name)}
    </span>
  )
}

export function CapacityLabel({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 tabular-nums text-muted-foreground', className)}>
      <Users className="size-4 text-muted-foreground" />
      {value}명
    </span>
  )
}
