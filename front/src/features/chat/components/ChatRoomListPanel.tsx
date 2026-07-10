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
import { Input } from '@/shared/ui/input'
import { useChatRoomsQuery } from '../api/useChatRoomsQuery'
import { useToggleBookmarkMutation } from '../api/useToggleBookmarkMutation'
import { useChatOverlayStore } from '../lib/chatOverlayStore'
import type { ChatRoomListItem } from '../model/chatRoom'
import { ChatRoomAvatar } from './ChatRoomAvatar'
import { ChatRoomNameUpdateDialog } from './ChatRoomNameUpdateDialog'
import { CreateChatRoomDialog } from './CreateChatRoomDialog'
import { LeaveChatRoomDialog } from './LeaveChatRoomDialog'

/**
 * 채팅방 목록 패널(ROADMAP(CHAT) T1.2, F901). 채팅 홈 화면(`ChatHomeScreen`)의 '채팅창목록'
 * 탭 콘텐츠로 렌더되며, `useChatRoomsQuery`(T1.1)로 내 채팅방 목록을 조회해 카드 리스트로 렌더한다.
 * `isPastRoom`(마지막 메시지 30일 경과) 기준으로 최근/오래된 두 그룹으로 나눠 렌더한다.
 *
 * 이 UI는 이후 adapt-ui 스킬로 비주얼이 교체될 예정이라, 지금은 시맨틱 마크업과 기능 동작
 * (검색/필터 상태 관리·카드 데이터 바인딩·클릭 시 방 선택·에러 토스트)만 갖추고 레이아웃/비주얼
 * 디테일(정교한 카드 디자인·반응형 그리드·애니메이션)에는 투자하지 않는다 — shadcn 컴포넌트를
 * 기본형 그대로 사용한다.
 *
 * 검색(`keyword`)·즐겨찾기 필터(`isBookmark`)는 로컬 상태를 그대로 `useChatRoomsQuery`의 query
 * params로 전달한다. 응답이 plain array(페이징 없음)라 board/department 목록과 달리 디바운스·
 * 페이지 리셋 개념이 없다.
 *
 * 즐겨찾기 별 토글(F910, ROADMAP(CHAT) T1.3): `useToggleBookmarkMutation`을 목록 컨테이너에서
 * 한 번만 호출하고, 방별 클릭 시 mutate variables(roomId·isBookmarked)로 대상을 넘긴다(행마다
 * 훅을 개별 호출하면 Hooks 규칙 위반이라 리스트 화면에서는 이 방식이 표준 패턴).
 *
 * [새 채팅] 버튼은 `CreateChatRoomDialog`(ROADMAP(CHAT) T3.1)를 연다 — 대상 사원 검색·다중 선택
 * (T3.1-a)부터 `CHAT_ROOM_CREATE` 생성·방 선택·목록 invalidate(T3.1-b)까지 다이얼로그 내부가 전담한다.
 */
export function ChatRoomListPanel() {
  const [keyword, setKeyword] = useState('')
  const [isBookmark, setIsBookmark] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  // 우클릭 컨텍스트 메뉴("방나가기"/"채팅방 이름변경") 대상 roomId. 다이얼로그는 이 값이
  // non-null일 때만 마운트해 LeaveChatRoomDialog/ChatRoomNameUpdateDialog의 roomId(non-nullable)
  // prop 요구를 그대로 만족시킨다.
  const [leaveTargetRoomId, setLeaveTargetRoomId] = useState<number | null>(null)
  const [renameTargetRoomId, setRenameTargetRoomId] = useState<number | null>(null)
  const selectRoom = useChatOverlayStore((state) => state.selectRoom)

  const roomsQuery = useChatRoomsQuery({
    keyword: keyword.trim() || undefined,
    isBookmark: isBookmark || undefined,
  })
  // 정렬(요청 사항): 즐겨찾기한 방을 먼저, 그다음 최근 활동순으로 위에 올린다. "최근 활동"으로
  // 쓸 수 있는 필드는 lastMessagedAt(마지막 메시지 발송 일시)뿐이다 — CHAT_ROOM_LIST 응답
  // (response-fields.adoc)과 도메인모델(ChatRoom "마지막 메시지가 생성되면 lastMessageAt을
  // 갱신한다")에 방 입장·퇴장 시각을 이 목록에서 노출하는 필드가 없어, 그 두 활동까지는 반영할
  // 수 없다(추측 금지 — 없는 필드를 임의로 만들지 않는다). 메시지가 아직 없는 방(null)은 가장
  // 아래로 보낸다.
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
      {/* 고정 서브 헤더: 섹션 라벨 + 새 채팅 액션, 그 아래 검색/즐겨찾기 필터. 목록만 스크롤한다. */}
      <div className="flex shrink-0 flex-col gap-3 border-b border-border px-4 pt-4 pb-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-muted-foreground">대화 목록</h2>
          <Button type="button" size="sm" onClick={handleCreateChat}>
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
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="chat-room-search"
              type="search"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="채팅방 검색"
              className="pl-8"
            />
          </div>
          <Button
            type="button"
            variant={isBookmark ? 'default' : 'outline'}
            size="icon"
            aria-pressed={isBookmark}
            aria-label="즐겨찾기만 보기"
            onClick={() => setIsBookmark((prev) => !prev)}
          >
            <Star className={isBookmark ? 'fill-current' : ''} aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* 로딩/에러/빈 상태를 순서대로 분기한다(DepartmentsPage/BoardListPage와 동일 컨벤션).
          placeholderData: keepPreviousData(useChatRoomsQuery)는 검색/필터 변경 중에는 이전 목록을
          유지하지만, 최초 로드 실패 시에는 유지할 데이터가 없어 data가 undefined가 된다 — 이 경우를
          "빈 상태"와 구분해 에러 문구를 렌더해야 조회 실패를 성공-빈결과로 오인시키지 않는다.
          에러 토스트는 위 useEffect가 별도로 띄우므로 여기서는 본문 문구만 담당한다. */}
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
              {/* 최근/오래된 그룹 경계: 좌우 얇은 선 + 가운데 라벨(레퍼런스 구분선). */}
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
  return (
    <li>
      {/* 별 토글 버튼을 카드 클릭(방 이동) 영역과 형제로 분리한다 — button 안에 button을 중첩하면
          유효하지 않은 HTML이라 카드 전체를 button으로 감싸던 이전 구조(T1.2)를 div로 바꿨다.
          호버 시 group 유틸로 별 버튼 표시를 강조한다. 우클릭은 ContextMenuTrigger가 가로채고
          좌클릭(방 진입)은 그대로 통과시키므로 기존 handleRoomClick 동작과 공존한다. */}
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="group flex items-center gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-muted">
            <button
              type="button"
              onClick={() => onClick(room.chatRoomId)}
              aria-label={room.roomName}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
              <ChatRoomAvatar isGroup={room.isGroup} />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  {/* todo: Open Q#3(PRD §❓, chatRoom.ts 동일 주석) roomName null 가능 여부/폴백 표기
                      미확정 — 서버 응답 문자열을 그대로 표시하고 폴백 로직을 임의로 발명하지 않는다. */}
                  <span className="truncate font-medium">{room.roomName}</span>
                  {room.isGroup && (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {room.joinedMemberCount}
                    </span>
                  )}
                  <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                    {room.lastMessagedAt ? dayjs(room.lastMessagedAt).format('MM-DD HH:mm') : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                    {room.lastMessageContent ?? '메시지 없음'}
                  </span>
                  {!!room.unreadMessageCount && (
                    <Badge className="shrink-0">{room.unreadMessageCount}</Badge>
                  )}
                </div>
              </div>
            </button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0 text-muted-foreground"
              aria-pressed={room.isBookmarked}
              aria-label={room.isBookmarked ? '즐겨찾기 해제' : '즐겨찾기 등록'}
              disabled={isBookmarkPending}
              onClick={() => onToggleBookmark(room.chatRoomId, room.isBookmarked)}
            >
              <Star className={room.isBookmarked ? 'fill-current text-foreground' : ''} />
            </Button>
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
