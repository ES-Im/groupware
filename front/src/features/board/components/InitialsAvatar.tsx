import { cn } from '@/shared/lib/utils'

interface InitialsAvatarProps {
  name: string
  className?: string
}

export function InitialsAvatar({ name, className }: InitialsAvatarProps) {
  const initials = name.trim().slice(0, 2) || '?'
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary',
        className,
      )}
    >
      {initials}
    </span>
  )
}
