import { User, Users } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

interface ChatRoomAvatarProps {
  /** 그룹 여부. true면 다인 아이콘(Users), false면 1:1 아이콘(User)을 렌더한다. */
  isGroup: boolean
  className?: string
}

/**
 * 채팅방 목록/상세 헤더 공용 아이콘 아바타(순수 프레젠테이셔널).
 * 방 자체에는 프로필 이미지가 없으므로(멤버만 BlobAvatar 사용), 그룹/1:1 여부를 lucide 아이콘으로
 * 시각화한다. 배경은 primary 토큰의 연한 틴트(bg-primary/10)와 primary 전경색을 써서 타겟 디자인의
 * 인디고 아바타 톤을 재현하되, 하드코딩 색 없이 토큰만 사용해 다크모드가 자동 대응된다.
 */
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
