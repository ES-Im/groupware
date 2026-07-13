import dayjs from 'dayjs'
import { Link } from 'react-router'
import { useEmployeeQuery } from '@/features/employee/api/useEmployeeQuery'
import { BlobAvatar } from '@/shared/components/BlobAvatar'
import { getActiveProfilePicture } from '@/shared/lib/activeFiles'
import type { MessagesResponse } from '../model/messageTypes'

interface UnreadMessageRowProps {
  message: MessagesResponse
}

/**
 * 안읽은 메시지 벨 패널 1행(요청: 발신자 프로필 미리보기·title·발송시각만 출력).
 *
 * 목록 응답(MessagesResponse)에는 senderId만 있고 프로필사진 fileId가 없어(발신자 프로필사진을
 * 실제로 조회하기로 한 결정 — 사용자 확인 완료), 행마다 useEmployeeQuery(senderId)로 사원 단건을
 * 조회해 activeFiles에서 fileId를 도출한다. 벨 패널은 목록을 소수(size 제한)만 보여주므로
 * N+1 호출 비용이 크지 않다. 같은 발신자가 여러 건을 보냈다면 React Query 캐시가 동일 queryKey로
 * 중복 요청을 자동으로 합친다.
 */
export function UnreadMessageRow({ message }: UnreadMessageRowProps) {
  const employeeQuery = useEmployeeQuery(message.senderId)
  const fileId = employeeQuery.data ? getActiveProfilePicture(employeeQuery.data.activeFiles) : undefined

  return (
    <Link
      to="/messages/received"
      role="row"
      className="flex items-center gap-2.5 px-2 py-2.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      <span role="cell" className="shrink-0">
        <BlobAvatar empId={message.senderId} fileId={fileId} fallbackText={message.senderName} className="size-8" />
      </span>
      <span role="cell" className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate font-medium">{message.title}</span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="truncate">{message.senderName}</span>
          <span aria-hidden="true">·</span>
          <span className="shrink-0 tabular-nums">
            {message.sentAt ? dayjs(message.sentAt).format('YYYY-MM-DD HH:mm') : '-'}
          </span>
        </span>
      </span>
    </Link>
  )
}
