import { Link } from 'react-router'
import { useMailboxCountsQuery } from '../api/useMailboxCountsQuery'
import { useMessagesQuery } from '../api/useMessagesQuery'
import { UnreadMessageRow } from './UnreadMessageRow'

/** 좌측 고정 패널 Reminders에 보여줄 안읽은 메시지 최대 건수(요청: "최근 3건만 출력"). */
const RAIL_UNREAD_PREVIEW_SIZE = 3

/**
 * 좌측 고정 패널의 Reminders 섹션(요청: "안읽은 쪽지 건수 뱃지 + 최근 3건만 출력 + 자세히 보기").
 * HeaderUnreadMessagesPanel과 동일한 API(받은함 isRead=false 최신순)를 재사용하되 건수만 3건으로
 * 줄인다. 뱃지 전체 건수는 useMailboxCountsQuery(사이드바 배지와 동일 소스)에서 가져온다.
 */
export function RailReminderPanel() {
  const mailboxCountsQuery = useMailboxCountsQuery()
  const unreadQuery = useMessagesQuery('received', { isRead: false, page: 0, size: RAIL_UNREAD_PREVIEW_SIZE })

  const unreadCount = mailboxCountsQuery.data?.unreadReceivedCount ?? 0
  const items = unreadQuery.data?.content ?? []

  return (
    // 좌측 고정 패널의 어두운 크롬 배경 위에 놓이므로 텍스트/보더를 primary-foreground/card-foreground
    // 계열로 스왑한다. 목록 행(UnreadMessageRow)은 헤더 벨 드롭다운(밝은 popover 표면)과 공유하는
    // 컴포넌트라 이 파일에서 색을 바꾸지 않는다 — 행 텍스트는 부모(패널) 색을 상속해 크롬 위에서도 읽힌다.
    <div className="px-4 py-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-[11px] font-semibold tracking-wide text-primary-foreground/60 uppercase dark:text-card-foreground/60">
          안 읽은 쪽지
        </span>
        {unreadCount > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] leading-none font-medium text-destructive-foreground">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </div>
      {unreadQuery.isLoading ? (
        <p className="py-4 text-center text-xs text-primary-foreground/60 dark:text-card-foreground/60">불러오는 중...</p>
      ) : items.length === 0 ? (
        <p className="py-4 text-center text-xs text-primary-foreground/60 dark:text-card-foreground/60">
          안읽은 쪽지가 없습니다.
        </p>
      ) : (
        <div className="divide-y divide-primary-foreground/10 rounded-md border border-primary-foreground/20 dark:divide-card-foreground/10 dark:border-card-foreground/20">
          {items.map((message) => (
            <UnreadMessageRow key={message.messageId} message={message} />
          ))}
        </div>
      )}
      <Link
        to="/messages/received"
        className="mt-2 block text-center text-xs font-medium text-primary-foreground/60 transition-colors hover:text-primary-foreground dark:text-card-foreground/60 dark:hover:text-card-foreground"
      >
        자세히 보기 →
      </Link>
    </div>
  )
}
