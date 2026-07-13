import { useEffect } from 'react'
import { toast } from 'sonner'
import { Link } from 'react-router'
import { handleApiError } from '@/shared/lib/apiError'
import { useMessagesQuery } from '../api/useMessagesQuery'
import { UnreadMessageRow } from './UnreadMessageRow'

/** 벨 패널에 보여줄 안읽은 메시지 최대 건수. 배지 전체 건수(unreadReceivedCount)와는 별개다. */
const UNREAD_PREVIEW_SIZE = 5

/**
 * 헤더 알림 벨 드롭다운 안의 안읽은 메시지 목록(요청: "안 읽은 message 건수만 리스트업").
 * 받은함(received)에서 isRead=false만 최신순 상위 N건 조회한다(기존 getMessages/useMessagesQuery
 * 그대로 재사용, 새 API 없음).
 */
export function HeaderUnreadMessagesPanel() {
  const unreadQuery = useMessagesQuery('received', { isRead: false, page: 0, size: UNREAD_PREVIEW_SIZE })

  useEffect(() => {
    if (!unreadQuery.error) {
      return
    }
    handleApiError(unreadQuery.error, { toast })
  }, [unreadQuery.error])

  const items = unreadQuery.data?.content ?? []

  return (
    <div className="w-80" role="table" aria-label="안읽은 쪽지">
      {/* 표 머리글: 드롭다운 성격을 알리는 라벨 행. */}
      <div className="px-2 pt-0.5 pb-1.5">
        <span className="text-xs font-semibold text-foreground">안읽은 쪽지</span>
      </div>
      {unreadQuery.isLoading ? (
        <p className="px-2 py-6 text-center text-sm text-muted-foreground">불러오는 중...</p>
      ) : items.length === 0 ? (
        <p className="px-2 py-6 text-center text-sm text-muted-foreground">안읽은 쪽지가 없습니다.</p>
      ) : (
        <div className="divide-y divide-border/70 border-y border-border" role="rowgroup">
          {items.map((message) => (
            <UnreadMessageRow key={message.messageId} message={message} />
          ))}
        </div>
      )}
      <Link
        to="/messages/received"
        className="mt-1 block rounded-md px-2 py-2 text-center text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        쪽지함 전체 보기
      </Link>
    </div>
  )
}
