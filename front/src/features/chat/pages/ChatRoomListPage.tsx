import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import dayjs from 'dayjs'
import { Star } from 'lucide-react'
import { toast } from 'sonner'
import { handleApiError } from '@/shared/lib/apiError'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { useChatRoomsQuery } from '../api/useChatRoomsQuery'
import { useToggleBookmarkMutation } from '../api/useToggleBookmarkMutation'
import { CreateChatRoomDialog } from '../components/CreateChatRoomDialog'
import type { ChatRoomListItem } from '../model/chatRoom'

/**
 * 채팅방 목록 패널(ROADMAP(CHAT) T1.2, F901). `/chat` 루트에서 `useChatRoomsQuery`(T1.1)로
 * 내 채팅방 목록을 조회해 카드 리스트로 렌더한다.
 *
 * 이 UI는 이후 adapt-ui 스킬로 비주얼이 교체될 예정이라, 지금은 시맨틱 마크업과 기능 동작
 * (검색/필터 상태 관리·카드 데이터 바인딩·클릭 라우팅·에러 토스트)만 갖추고 레이아웃/비주얼
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
 * (T3.1-a)부터 `CHAT_ROOM_CREATE` 생성·이동·목록 invalidate(T3.1-b)까지 다이얼로그 내부가 전담한다.
 */
export function ChatRoomListPage() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [isBookmark, setIsBookmark] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const roomsQuery = useChatRoomsQuery({
    keyword: keyword.trim() || undefined,
    isBookmark: isBookmark || undefined,
  })
  const rooms = roomsQuery.data ?? []

  const bookmarkMutation = useToggleBookmarkMutation()

  useEffect(() => {
    if (!roomsQuery.error) {
      return
    }
    handleApiError(roomsQuery.error, { toast })
  }, [roomsQuery.error])

  function handleRoomClick(chatRoomId: number) {
    navigate(`/chat/rooms/${chatRoomId}`)
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
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">채팅</h1>
        <Button type="button" size="sm" onClick={handleCreateChat}>
          새 채팅
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="chat-room-search" className="sr-only">
          채팅방 검색
        </label>
        <Input
          id="chat-room-search"
          type="search"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="채팅방 검색"
        />
        <Button
          type="button"
          variant={isBookmark ? 'default' : 'outline'}
          size="sm"
          aria-pressed={isBookmark}
          onClick={() => setIsBookmark((prev) => !prev)}
        >
          즐겨찾기만
        </Button>
      </div>

      {/* 로딩/에러/빈 상태를 순서대로 분기한다(DepartmentsPage/BoardListPage와 동일 컨벤션).
          placeholderData: keepPreviousData(useChatRoomsQuery)는 검색/필터 변경 중에는 이전 목록을
          유지하지만, 최초 로드 실패 시에는 유지할 데이터가 없어 data가 undefined가 된다 — 이 경우를
          "빈 상태"와 구분해 에러 문구를 렌더해야 조회 실패를 성공-빈결과로 오인시키지 않는다.
          에러 토스트는 위 useEffect가 별도로 띄우므로 여기서는 본문 문구만 담당한다. */}
      {roomsQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      ) : roomsQuery.error ? (
        <p className="text-sm text-muted-foreground">채팅방 목록을 불러오지 못했습니다.</p>
      ) : rooms.length === 0 ? (
        <p className="text-sm text-muted-foreground">채팅방이 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rooms.map((room) => (
            <ChatRoomListRow
              key={room.chatRoomId}
              room={room}
              onClick={handleRoomClick}
              onToggleBookmark={handleToggleBookmark}
              isBookmarkPending={
                bookmarkMutation.isPending && bookmarkMutation.variables?.roomId === room.chatRoomId
              }
            />
          ))}
        </ul>
      )}

      <CreateChatRoomDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </div>
  )
}

function ChatRoomListRow({
  room,
  onClick,
  onToggleBookmark,
  isBookmarkPending,
}: {
  room: ChatRoomListItem
  onClick: (chatRoomId: number) => void
  onToggleBookmark: (chatRoomId: number, currentIsBookmarked: boolean) => void
  isBookmarkPending: boolean
}) {
  return (
    <li>
      {/* 별 토글 버튼을 카드 클릭(방 이동) 영역과 형제로 분리한다 — button 안에 button을 중첩하면
          유효하지 않은 HTML이라 카드 전체를 button으로 감싸던 이전 구조(T1.2)를 div로 바꿨다. */}
      <div
        className={`flex items-center gap-1 rounded-md border p-3 ${
          room.isPastRoom ? 'opacity-50' : ''
        }`}
      >
        <button
          type="button"
          onClick={() => onClick(room.chatRoomId)}
          aria-label={room.roomName}
          className="flex flex-1 flex-col gap-1 text-left"
        >
          <div className="flex items-center justify-between gap-2">
            {/* todo: Open Q#3(PRD §❓, chatRoom.ts 동일 주석) roomName null 가능 여부/폴백 표기
                미확정 — 서버 응답 문자열을 그대로 표시하고 폴백 로직을 임의로 발명하지 않는다. */}
            <span className="font-medium">{room.roomName}</span>
            {!!room.unreadMessageCount && <Badge>{room.unreadMessageCount}</Badge>}
          </div>
          <div className="text-sm text-muted-foreground">
            {room.isGroup ? `그룹 · 참여 ${room.joinedMemberCount}명` : '1:1 대화'}
          </div>
          <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
            <span className="truncate">{room.lastMessageContent ?? '메시지 없음'}</span>
            <span>{room.lastMessagedAt ? dayjs(room.lastMessagedAt).format('MM-DD HH:mm') : ''}</span>
          </div>
        </button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-pressed={room.isBookmarked}
          aria-label={room.isBookmarked ? '즐겨찾기 해제' : '즐겨찾기 등록'}
          disabled={isBookmarkPending}
          onClick={() => onToggleBookmark(room.chatRoomId, room.isBookmarked)}
        >
          <Star className={room.isBookmarked ? 'fill-current' : ''} />
        </Button>
      </div>
    </li>
  )
}
