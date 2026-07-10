import { useRef, useState } from 'react'
import { LogOut, Pencil, Settings, UserPlus } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { useChatOverlayStore } from '../lib/chatOverlayStore'
import { ChatRoomNameUpdateDialog } from './ChatRoomNameUpdateDialog'
import { LeaveChatRoomDialog } from './LeaveChatRoomDialog'

/** 트리거에서 콘텐츠로 마우스가 이동하는 동안 깜빡이지 않도록 주는 닫힘 유예(ms). */
const HOVER_CLOSE_DELAY_MS = 150

/**
 * 대화 화면 방 설정 메뉴(ROADMAP(CHAT) T4.1, F908·F909·§페이지별 상세(방 설정 메뉴)).
 *
 * 클릭 트리거 대신 hover 트리거로 동작한다 — `open`/`onOpenChange`를 이 컴포넌트가 직접
 * `useState`로 제어하고, 트리거를 감싸는 wrapper의 `onMouseEnter`/`onMouseLeave`로 열고 닫는다.
 * `DropdownMenuContent`는 Radix Portal로 트리거 DOM 트리 밖에 렌더되므로 wrapper의
 * mouseleave만으로는 트리거→콘텐츠 이동 중 닫혀버린다 — `DropdownMenuContent`에도 동일한
 * mouseenter/mouseleave 핸들러를 직접 걸어 그 이동 구간을 커버한다. 클릭도 Radix 기본 동작으로
 * 여전히 동작한다(hover 전용으로 클릭을 막지 않는다).
 *
 * 멤버 초대(F907, T4.2)는 이제 이 메뉴가 아니라 chatOverlayStore의 `startInviteFlow`로 홈 화면
 * 사원목록 탭 초대 모드를 여는 방식으로 이전됐다(ChatEmployeeListPanel 참조) — 메뉴 항목 클릭은
 * 스토어 액션만 호출한다. 즐겨찾기 토글 항목은 이 메뉴에서 제거됐다(스펙 축소) — 단
 * `useToggleBookmarkMutation` 자체와 `ChatRoomListPanel`의 별표 버튼은 그대로 유지된다.
 *
 * 나가기(T4.4, F909)·표시명 수정(T4.3, F908)은 기존과 동일하게 별도 컨트롤드
 * 다이얼로그(`LeaveChatRoomDialog`/`ChatRoomNameUpdateDialog`)로 위임한다(DropdownMenuItem
 * 안에 트리거를 중첩하면 Radix 포커스 트랩이 충돌하므로 회피).
 */
export function ChatRoomSettingsMenu({ roomId }: { roomId: number }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false)
  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const startInviteFlow = useChatOverlayStore((state) => state.startInviteFlow)

  function clearCloseTimer() {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }

  function handleMouseEnter() {
    clearCloseTimer()
    setIsMenuOpen(true)
  }

  function handleMouseLeave() {
    clearCloseTimer()
    closeTimerRef.current = setTimeout(() => setIsMenuOpen(false), HOVER_CLOSE_DELAY_MS)
  }

  function handleInvite() {
    startInviteFlow(roomId)
  }

  function handleUpdateName() {
    setIsNameDialogOpen(true)
  }

  function handleLeave() {
    setIsLeaveDialogOpen(true)
  }

  return (
    <>
      <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="icon" aria-label="채팅방 설정">
              <Settings aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <DropdownMenuItem onSelect={handleInvite}>
              <UserPlus aria-hidden="true" />
              멤버초대
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleUpdateName}>
              <Pencil aria-hidden="true" />
              채팅방이름 변경
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={handleLeave}>
              <LogOut aria-hidden="true" />
              방퇴장하기
            </DropdownMenuItem>
          </DropdownMenuContent>
        </div>
      </DropdownMenu>
      <LeaveChatRoomDialog roomId={roomId} open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen} />
      <ChatRoomNameUpdateDialog roomId={roomId} open={isNameDialogOpen} onOpenChange={setIsNameDialogOpen} />
    </>
  )
}
