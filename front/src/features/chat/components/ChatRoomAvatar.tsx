import { User, Users } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

interface ChatRoomAvatarProps {
  isGroup: boolean
  className?: string
}

export function ChatRoomAvatar({ isGroup, className }: ChatRoomAvatarProps) {
  const Icon = isGroup ? Users : User
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary',
        className,
      )}
    >
      <Icon className="size-5" />
    </span>
  )
}
