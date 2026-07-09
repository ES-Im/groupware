import { User, Users } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

interface ChatRoomAvatarProps {
  /** 그룹 여부. true면 다인 아이콘(Users), false면 1:1 아이콘(User)을 렌더한다. */
  isGroup: boolean
  className?: string
}

/**
 * 채팅방 목록/상세 헤더 공용 아이콘 아바타(순수 프레젠테이셔널).
 * 방 자체에는 프로필 이미지가 없으므로(멤버만 BlobAvatar 사용), 그룹/1:1 여부를 중립 토큰 원형
 * 배경 + lucide 아이콘으로 시각화한다. 커스텀 팔레트 없이 muted 토큰만 사용해 다크모드가 자동
 * 대응된다.
 */
export function ChatRoomAvatar({ isGroup, className }: ChatRoomAvatarProps) {
  const Icon = isGroup ? Users : User
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground',
        className,
      )}
    >
      <Icon className="size-5" />
    </span>
  )
}
