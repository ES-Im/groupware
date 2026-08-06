import { Link } from 'react-router'
import { useMailboxCountsQuery } from '../api/useMailboxCountsQuery'
import { useMessagesQuery } from '../api/useMessagesQuery'
import { UnreadMessageRow } from './UnreadMessageRow'

const RAIL_UNREAD_PREVIEW_SIZE = 3

export function RailReminderPanel() {
  const mailboxCountsQuery = useMailboxCountsQuery()
  const unreadQuery = useMessagesQuery('received', { isRead: false, page: 0, size: RAIL_UNREAD_PREVIEW_SIZE })

  const unreadCount = mailboxCountsQuery.data?.unreadReceivedCount ?? 0
  const items = unreadQuery.data?.content ?? []

  return (
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
