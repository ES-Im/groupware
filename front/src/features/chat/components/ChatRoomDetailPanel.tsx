import { Fragment, useEffect, useLayoutEffect, useRef } from 'react'
import type { UIEvent } from 'react'
import dayjs from 'dayjs'
import { ChevronLeft, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { useMeQuery } from '@/features/employee/api/useMeQuery'
import { BlobAvatar } from '@/shared/components/BlobAvatar'
import { isForbidden, isNotFound, normalizeApiError } from '@/shared/lib/apiError'
import { Button } from '@/shared/ui/button'
import { useChatMessagesQuery } from '../api/useChatMessagesQuery'
import { useChatRoomDetailQuery } from '../api/useChatRoomDetailQuery'
import { useChatRoomSubscription } from '../hooks/useChatRoomSubscription'
import { useReadPositionSync } from '../hooks/useReadPositionSync'
import { useChatOverlayStore } from '../lib/chatOverlayStore'
import { parseEmpFilePreviewFileId } from '../lib/parseEmpFilePreviewFileId'
import { resolveChatRoomDisplayName } from '../lib/resolveChatRoomDisplayName'
import type { ChatMessage } from '../model/chatMessage'
import { ChatMessageInput } from './ChatMessageInput'
import { ChatRoomAvatar } from './ChatRoomAvatar'
import { ChatRoomSettingsMenu } from './ChatRoomSettingsMenu'

const SCROLL_TOP_THRESHOLD = 24

export function ChatRoomDetailPanel({ roomId }: { roomId: number }) {
  const backToList = useChatOverlayStore((state) => state.backToList)
  const startInviteFlow = useChatOverlayStore((state) => state.startInviteFlow)
  const meQuery = useMeQuery()
  const myEmpId = meQuery.data?.empBasicInfo.empId

  const detailQuery = useChatRoomDetailQuery(roomId)
  useChatRoomSubscription(roomId)

  useEffect(() => {
    if (!detailQuery.error) {
      return
    }
    const apiError = normalizeApiError(detailQuery.error)
    if (!isNotFound(apiError) && !isForbidden(apiError)) {
      toast.error(apiError.message)
    }
  }, [detailQuery.error])

  function handleBack() {
    backToList()
  }

  const backButton = (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="shrink-0 text-muted-foreground hover:text-foreground"
      aria-label="목록으로"
      onClick={handleBack}
    >
      <ChevronLeft aria-hidden="true" />
    </Button>
  )

  if (detailQuery.isLoading) {
    return (
      <div className="flex h-full flex-col gap-4 p-4">
        {backButton}
        <p className="text-sm text-muted-foreground">채팅방을 불러오는 중...</p>
      </div>
    )
  }

  if (detailQuery.error) {
    const apiError = normalizeApiError(detailQuery.error)
    if (isNotFound(apiError)) {
      return (
        <div className="flex h-full flex-col gap-4 p-4">
          {backButton}
          <p className="text-sm text-muted-foreground">채팅방을 찾을 수 없습니다.</p>
        </div>
      )
    }
    if (isForbidden(apiError)) {
      return (
        <div className="flex h-full flex-col gap-4 p-4">
          {backButton}
          <p className="text-sm text-muted-foreground">이 채팅방을 조회할 권한이 없습니다.</p>
        </div>
      )
    }
    return (
      <div className="flex h-full flex-col gap-4 p-4">
        {backButton}
        <p className="text-sm text-muted-foreground">채팅방을 불러오지 못했습니다.</p>
      </div>
    )
  }

  if (!detailQuery.data) {
    return null
  }

  const room = detailQuery.data

  const participantNames = room.members
    .filter((member) => member.memberId !== myEmpId)
    .map((member) => member.memberName)
  const displayName = resolveChatRoomDisplayName(room.roomName, participantNames)

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2.5">
        {backButton}
        <ChatRoomAvatar isGroup={room.isGroup} className="size-9" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold">{displayName}</h1>
          <p className="truncate text-xs text-muted-foreground">
            {room.isGroup ? `참여 ${room.members.length}명` : '1:1 대화'}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0 text-muted-foreground hover:text-foreground"
          aria-label="멤버 초대"
          onClick={() => startInviteFlow(room.roomId)}
        >
          <UserPlus aria-hidden="true" />
        </Button>
        <ChatRoomSettingsMenu roomId={room.roomId} />
      </header>

      <div className="flex shrink-0 items-start gap-3 overflow-x-auto border-b border-border bg-muted/30 px-3 py-2.5">
        {room.members.map((member) => (
          <div
            key={member.memberId}
            className="flex w-14 shrink-0 flex-col items-center gap-1 text-center"
          >
            <BlobAvatar
              empId={member.memberId}
              fileId={parseEmpFilePreviewFileId(member.profileImageUrl)}
              fallbackText={member.memberName}
            />
            <span className="max-w-full truncate text-xs font-medium">{member.memberName}</span>
            {member.deptName && (
              <span className="max-w-full truncate text-[10px] text-muted-foreground">
                {member.deptName}
              </span>
            )}
          </div>
        ))}
      </div>

      <ChatMessageArea roomId={room.roomId} lastReadMessageId={room.lastReadMessageId} />
      <ChatMessageInput roomId={room.roomId} />
    </div>
  )
}

function ChatMessageArea({
  roomId,
  lastReadMessageId,
}: {
  roomId: number
  lastReadMessageId: number | null
}) {
  const messagesQuery = useChatMessagesQuery(roomId)
  const meQuery = useMeQuery()
  const myEmpId = meQuery.data?.empBasicInfo.empId
  const containerRef = useRef<HTMLDivElement>(null)
  const prevScrollHeightRef = useRef<number | null>(null)

  useEffect(() => {
    if (!messagesQuery.error) {
      return
    }
    const apiError = normalizeApiError(messagesQuery.error)
    if (!isNotFound(apiError) && !isForbidden(apiError)) {
      toast.error(apiError.message)
    }
  }, [messagesQuery.error])

  const pages = messagesQuery.data?.pages ?? []
  const messages = pages.slice().reverse().flatMap((page) => page.messages)

  useReadPositionSync(roomId, messages)

  const unreadSnapshotRef = useRef<{
    roomId: number
    firstUnreadClientMessageId: string | null
    count: number
  } | null>(null)
  if (!messagesQuery.isLoading && unreadSnapshotRef.current?.roomId !== roomId) {
    const unreadAtEntry =
      lastReadMessageId == null
        ? []
        : messages.filter((message) => message.id > 0 && message.id > lastReadMessageId)
    unreadSnapshotRef.current = {
      roomId,
      firstUnreadClientMessageId: unreadAtEntry[0]?.clientMessageId ?? null,
      count: unreadAtEntry.length,
    }
  }
  const unreadSnapshot =
    unreadSnapshotRef.current?.roomId === roomId ? unreadSnapshotRef.current : null
  const firstUnreadIndex =
    unreadSnapshot?.firstUnreadClientMessageId == null
      ? -1
      : messages.findIndex((message) => message.clientMessageId === unreadSnapshot.firstUnreadClientMessageId)
  const unreadCount = unreadSnapshot?.count ?? 0

  function handleScroll(event: UIEvent<HTMLDivElement>) {
    const el = event.currentTarget
    if (el.scrollTop > SCROLL_TOP_THRESHOLD) {
      return
    }
    if (!messagesQuery.hasNextPage || messagesQuery.isFetchingNextPage) {
      return
    }
    prevScrollHeightRef.current = el.scrollHeight
    messagesQuery.fetchNextPage()
  }

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) {
      return
    }
    if (prevScrollHeightRef.current != null) {
      el.scrollTop = el.scrollHeight - prevScrollHeightRef.current
      prevScrollHeightRef.current = null
      return
    }
    if (messages.length === 0) {
      return
    }
    el.scrollTop = el.scrollHeight
  }, [messages.length])

  if (messagesQuery.isLoading) {
    return <div className="flex-1 p-4 text-sm text-muted-foreground">메시지를 불러오는 중...</div>
  }

  if (messagesQuery.error) {
    const apiError = normalizeApiError(messagesQuery.error)
    if (isNotFound(apiError) || isForbidden(apiError)) {
      return (
        <div className="flex-1 p-4 text-sm text-muted-foreground">메시지를 불러올 수 없습니다.</div>
      )
    }
    return (
      <div className="flex-1 p-4 text-sm text-muted-foreground">메시지를 불러오지 못했습니다.</div>
    )
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="min-h-0 flex-1 overflow-y-auto px-3 py-4"
    >
      {messagesQuery.isFetchingNextPage && (
        <p className="pb-2 text-center text-xs text-muted-foreground">이전 메시지를 불러오는 중...</p>
      )}
      {messages.length === 0 ? (
        <p className="text-sm text-muted-foreground">메시지가 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {messages.map((message, index) => (
            <Fragment key={message.clientMessageId}>
              {index === firstUnreadIndex && (
                <li aria-hidden="true" className="flex items-center gap-2 py-1">
                  <span className="h-px flex-1 bg-border" />
                  <span className="shrink-0 text-xs text-muted-foreground">
                    안 읽은 메시지 {unreadCount}개
                  </span>
                  <span className="h-px flex-1 bg-border" />
                </li>
              )}
              <ChatMessageRow message={message} isMine={message.senderId === myEmpId} />
            </Fragment>
          ))}
        </ul>
      )}
    </div>
  )
}

function ChatMessageRow({ message, isMine }: { message: ChatMessage; isMine: boolean }) {
  const isPending = message.id < 0
  return (
    <li
      className={`flex items-start gap-2.5 ${isMine ? 'flex-row-reverse' : ''} ${isPending ? 'opacity-60' : ''}`}
    >
      <BlobAvatar
        empId={message.senderId}
        fileId={parseEmpFilePreviewFileId(message.profileImageUrl)}
        fallbackText={message.senderName}
      />
      <div className={`flex min-w-0 flex-col gap-1 ${isMine ? 'items-end' : ''}`}>
        <div className={`flex items-baseline gap-2 ${isMine ? 'flex-row-reverse' : ''}`}>
          <span className="text-xs font-medium">{message.senderName}</span>
          <span className="text-[10px] text-muted-foreground">
            {isPending ? '전송 중...' : dayjs(message.sentAt).format('MM-DD HH:mm')}
          </span>
        </div>
        <p
          className={`w-fit max-w-full whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
            isMine
              ? 'rounded-tr-sm bg-primary text-primary-foreground'
              : 'rounded-tl-sm bg-muted'
          }`}
        >
          {message.content}
        </p>
      </div>
    </li>
  )
}
