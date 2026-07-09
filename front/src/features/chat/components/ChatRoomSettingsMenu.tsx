import { useState } from 'react'
import { LogOut, Pencil, Settings, Star, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { handleApiError } from '@/shared/lib/apiError'
import { Button } from '@/shared/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { useChatRoomsQuery } from '../api/useChatRoomsQuery'
import { useToggleBookmarkMutation } from '../api/useToggleBookmarkMutation'
import { ChatRoomInviteDialog } from './ChatRoomInviteDialog'
import { ChatRoomNameUpdateDialog } from './ChatRoomNameUpdateDialog'
import { LeaveChatRoomDialog } from './LeaveChatRoomDialog'

/**
 * 대화 화면 방 설정 메뉴(ROADMAP(CHAT) T4.1, F907·F908·F909·F910·§페이지별 상세(방 설정 메뉴)).
 *
 * 즐겨찾기 항목은 `useToggleBookmarkMutation`(T1.3)을 그대로 재사용하며 새 mutation을 만들지
 * 않는다. 나가기(T4.4, F909)는 `LeaveChatRoomDialog`(별도 컨트롤드 AlertDialog)로 확인 후
 * `CHAT_ROOM_LEAVE`를 호출한다 — 메뉴 항목 클릭은 다이얼로그 열림 상태만 토글하고, 실제 호출·
 * 이동 로직은 다이얼로그 컴포넌트가 전담한다(`CreateChatRoomDialog`와 동일한 제어형 분리
 * 컨벤션 — DropdownMenuItem 안에 AlertDialogTrigger/DialogTrigger를 중첩하면 Radix 메뉴/다이얼로그
 * 포커스 트랩이 충돌하므로 회피). 표시명 수정(T4.3, F908)도 동일 패턴으로
 * `ChatRoomNameUpdateDialog`(별도 컨트롤드 Dialog)를 연결한다. 멤버 초대(T4.2, F907)도 동일
 * 패턴으로 `ChatRoomInviteDialog`(별도 컨트롤드 Dialog, T3.1-a `EmployeePicker` 재사용)를 연결한다.
 *
 * `CHAT_ROOM_DETAIL` 응답(ChatRoomDetail 모델)에는 isBookmarked 필드가 없다(back
 * ChatRoomDetailResponse 실측 — 목록 응답 MyChatRoomsResponse에만 존재). 상세 화면 전용 필드를
 * 임의로 발명하지 않고, 이미 존재하는 T1.1 목록 조회 훅을 필터 없이 재사용해 현재 방의
 * isBookmarked를 찾아 쓴다. 무필터로 호출하는 이유: 목록 패널이 "즐겨찾기만" 필터나 검색어로
 * 좁혀진 상태라면 그 결과에는 현재 방이 아예 없을 수 있어, 필터가 걸린 쪽을 재사용하면 오히려
 * 현재 방을 못 찾게 된다.
 *
 * 주의: 이 무필터 호출(`chatKeys.rooms(undefined)`)은 `ChatRoomListPage`가 쓰는 쿼리키
 * (`chatKeys.rooms({ keyword: undefined, isBookmark: undefined })`)와 값은 같아 보여도
 * 형태가 달라 TanStack Query에서 별개의 캐시 엔트리로 취급된다 — 즉 목록 패널이 이미
 * 불러온 결과를 캐시 히트로 재사용하지 않으며, 대화 화면 진입 시(목록을 거쳐 왔든 딥링크든)
 * `CHAT_ROOM_LIST` GET이 별도로 한 번 더 발생할 수 있다. 로딩 중에는 `isBookmarked`를 아직
 * 알 수 없어 아래 즐겨찾기 항목을 `roomsQuery.isLoading` 동안 비활성화한다(폴백값 `false`로
 * 인한 잘못된 토글 분기 방지).
 */
export function ChatRoomSettingsMenu({ roomId }: { roomId: number }) {
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false)
  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false)
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)

  const roomsQuery = useChatRoomsQuery()
  const currentRoom = roomsQuery.data?.find((room) => room.chatRoomId === roomId)
  const isBookmarked = currentRoom?.isBookmarked ?? false

  const bookmarkMutation = useToggleBookmarkMutation()

  function handleToggleBookmark() {
    bookmarkMutation.mutate(
      { roomId, isBookmarked },
      { onError: (error) => handleApiError(error, { toast }) },
    )
  }

  function handleInvite() {
    setIsInviteDialogOpen(true)
  }

  function handleUpdateName() {
    setIsNameDialogOpen(true)
  }

  function handleLeave() {
    setIsLeaveDialogOpen(true)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="ghost" size="icon" aria-label="채팅방 설정">
            <Settings aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={handleInvite}>
            <UserPlus aria-hidden="true" />
            멤버 초대
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleUpdateName}>
            <Pencil aria-hidden="true" />
            표시명 수정
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={handleToggleBookmark}
            disabled={bookmarkMutation.isPending || roomsQuery.isLoading}
          >
            <Star className={isBookmarked ? 'fill-current' : ''} aria-hidden="true" />
            {isBookmarked ? '즐겨찾기 해제' : '즐겨찾기 등록'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={handleLeave}>
            <LogOut aria-hidden="true" />
            나가기
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <LeaveChatRoomDialog roomId={roomId} open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen} />
      <ChatRoomNameUpdateDialog roomId={roomId} open={isNameDialogOpen} onOpenChange={setIsNameDialogOpen} />
      <ChatRoomInviteDialog roomId={roomId} open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen} />
    </>
  )
}
