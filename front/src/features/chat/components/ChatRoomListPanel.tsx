import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { Search, SquarePen, Star } from 'lucide-react'
import { toast } from 'sonner'
import { handleApiError } from '@/shared/lib/apiError'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/shared/ui/context-menu'
import { cn } from '@/shared/lib/utils'
import { Input } from '@/shared/ui/input'
import { useChatRoomsQuery } from '../api/useChatRoomsQuery'
import { useToggleBookmarkMutation } from '../api/useToggleBookmarkMutation'
import { resolveChatRoomDisplayName } from '../lib/resolveChatRoomDisplayName'
import { useChatOverlayStore } from '../lib/chatOverlayStore'
import type { ChatRoomListItem } from '../model/chatRoom'
import { ChatRoomAvatar } from './ChatRoomAvatar'
import { ChatRoomNameUpdateDialog } from './ChatRoomNameUpdateDialog'
import { CreateChatRoomDialog } from './CreateChatRoomDialog'
import { LeaveChatRoomDialog } from './LeaveChatRoomDialog'

export function ChatRoomListPanel() {
  const [keyword, setKeyword] = useState('')
  const [isBookmark, setIsBookmark] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [leaveTargetRoomId, setLeaveTargetRoomId] = useState<number | null>(null)
  const [renameTargetRoomId, setRenameTargetRoomId] = useState<number | null>(null)
  const selectRoom = useChatOverlayStore((state) => state.selectRoom)

  const roomsQuery = useChatRoomsQuery({
    keyword: keyword.trim() || undefined,
    isBookmark: isBookmark || undefined,
  })
  const sortedRooms = [...(roomsQuery.data ?? [])].sort((a, b) => {
    if (a.isBookmarked !== b.isBookmarked) {
      return a.isBookmarked ? -1 : 1
    }
    if (a.lastMessagedAt == null && b.lastMessagedAt == null) {
      return 0
    }
    if (a.lastMessagedAt == null) {
      return 1
    }
    if (b.lastMessagedAt == null) {
      return -1
    }
    return dayjs(b.lastMessagedAt).diff(dayjs(a.lastMessagedAt))
  })
  const recentRooms = sortedRooms.filter((room) => !room.isPastRoom)
  const oldRooms = sortedRooms.filter((room) => room.isPastRoom)

  const bookmarkMutation = useToggleBookmarkMutation()

  useEffect(() => {
    if (!roomsQuery.error) {
      return
    }
    handleApiError(roomsQuery.error, { toast })
  }, [roomsQuery.error])

  function handleRoomClick(chatRoomId: number) {
    selectRoom(chatRoomId)
  }

  function handleToggleBookmark(chatRoomId: number, currentIsBookmarked: boolean) {
    bookmarkMutation.mutate(
      { roomId: chatRoomId, isBookmarked: currentIsBookmarked },
      { onError: (error) => handleApiError(error, { toast }) },
    )
  }

  function handleCreateChat() {
    setCreateDialogOpen(true)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 flex-col gap-3 border-b border-border px-4 pt-4 pb-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">대화 목록</h2>
          <Button type="button" size="sm" className="rounded-lg" onClick={handleCreateChat}>
            <SquarePen aria-hidden="true" />
            새 채팅
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="chat-room-search" className="sr-only">
            채팅방 검색
          </label>
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="chat-room-search"
              type="search"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="채팅방 검색"
              className="rounded-xl pl-9"
            />
          </div>
          <Button
            type="button"
            variant={isBookmark ? 'secondary' : 'outline'}
            size="icon"
            className="shrink-0 rounded-xl"
            aria-pressed={isBookmark}
            aria-label="즐겨찾기만 보기"
            onClick={() => setIsBookmark((prev) => !prev)}
          >
            <Star
              className={cn('size-4', isBookmark ? 'fill-amber-400 text-amber-500' : '')}
              aria-hidden="true"
            />
          </Button>
        </div>
      </div>

      {roomsQuery.isLoading ? (
        <p className="p-4 text-sm text-muted-foreground">불러오는 중...</p>
      ) : roomsQuery.error ? (
        <p className="p-4 text-sm text-muted-foreground">채팅방 목록을 불러오지 못했습니다.</p>
      ) : sortedRooms.length === 0 ? (
        <p className="p-4 text-sm text-muted-foreground">채팅방이 없습니다.</p>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2">
          {recentRooms.length > 0 && (
            <ul className="flex flex-col gap-0.5">
              {recentRooms.map((room) => (
                <ChatRoomListRow
                  key={room.chatRoomId}
                  room={room}
                  onClick={handleRoomClick}
                  onToggleBookmark={handleToggleBookmark}
                  onRequestLeave={setLeaveTargetRoomId}
                  onRequestRename={setRenameTargetRoomId}
                  isBookmarkPending={
                    bookmarkMutation.isPending && bookmarkMutation.variables?.roomId === room.chatRoomId
                  }
                />
              ))}
            </ul>
          )}
          {oldRooms.length > 0 && (
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2 px-2 py-1.5">
                <span className="h-px flex-1 bg-border" aria-hidden="true" />
                <span className="text-xs font-medium text-muted-foreground">오래된 채팅방</span>
                <span className="h-px flex-1 bg-border" aria-hidden="true" />
              </div>
              <ul className="flex flex-col gap-0.5">
                {oldRooms.map((room) => (
                  <ChatRoomListRow
                    key={room.chatRoomId}
                    room={room}
                    onClick={handleRoomClick}
                    onToggleBookmark={handleToggleBookmark}
                    onRequestLeave={setLeaveTargetRoomId}
                    onRequestRename={setRenameTargetRoomId}
                    isBookmarkPending={
                      bookmarkMutation.isPending && bookmarkMutation.variables?.roomId === room.chatRoomId
                    }
                  />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <CreateChatRoomDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      {leaveTargetRoomId != null && (
        <LeaveChatRoomDialog
          roomId={leaveTargetRoomId}
          open
          onOpenChange={(open) => {
            if (!open) {
              setLeaveTargetRoomId(null)
            }
          }}
        />
      )}
      {renameTargetRoomId != null && (
        <ChatRoomNameUpdateDialog
          roomId={renameTargetRoomId}
          open
          onOpenChange={(open) => {
            if (!open) {
              setRenameTargetRoomId(null)
            }
          }}
        />
      )}
    </div>
  )
}

function ChatRoomListRow({
  room,
  onClick,
  onToggleBookmark,
  onRequestLeave,
  onRequestRename,
  isBookmarkPending,
}: {
  room: ChatRoomListItem
  onClick: (chatRoomId: number) => void
  onToggleBookmark: (chatRoomId: number, currentIsBookmarked: boolean) => void
  onRequestLeave: (chatRoomId: number) => void
  onRequestRename: (chatRoomId: number) => void
  isBookmarkPending: boolean
}) {
  const displayName = resolveChatRoomDisplayName(room.roomName, room.participantNames)
  const unreadCount = room.unreadMessageCount ?? 0
  const isUnread = unreadCount > 0
  return (
    <li>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="group flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-muted">
            <button
              type="button"
              onClick={() => onClick(room.chatRoomId)}
              aria-label={displayName}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
              <ChatRoomAvatar isGroup={room.isGroup} />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                  <span className={cn('truncate', isUnread ? 'font-bold' : 'font-medium')}>
                    {displayName}
                  </span>
                  {room.isGroup && (
                    <span className="shrink-0 text-xs font-medium text-muted-foreground">
                      {room.joinedMemberCount}
                    </span>
                  )}
                </div>
                <span
                  className={cn(
                    'truncate text-xs',
                    isUnread ? 'font-medium text-foreground/80' : 'text-muted-foreground',
                  )}
                >
                  {room.lastMessageContent ?? '메시지 없음'}
                </span>
              </div>
            </button>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <span className="text-[11px] text-muted-foreground">
                {room.lastMessagedAt ? dayjs(room.lastMessagedAt).format('MM-DD HH:mm') : ''}
              </span>
              <div className="flex items-center gap-1">
                {isUnread && (
                  <Badge className="h-5 min-w-5 justify-center rounded-full px-1.5 text-[11px]">
                    {unreadCount}
                  </Badge>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className={cn(
                    'size-6 shrink-0',
                    room.isBookmarked ? 'text-amber-500' : 'text-muted-foreground/50',
                  )}
                  aria-pressed={room.isBookmarked}
                  aria-label={room.isBookmarked ? '즐겨찾기 해제' : '즐겨찾기 등록'}
                  disabled={isBookmarkPending}
                  onClick={() => onToggleBookmark(room.chatRoomId, room.isBookmarked)}
                >
                  <Star className={cn('size-4', room.isBookmarked && 'fill-current')} />
                </Button>
              </div>
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onSelect={() => onRequestLeave(room.chatRoomId)}>방나가기</ContextMenuItem>
          <ContextMenuItem onSelect={() => onRequestRename(room.chatRoomId)}>
            채팅방 이름변경
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </li>
  )
}
