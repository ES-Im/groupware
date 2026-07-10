import { useEffect } from 'react'
import { MessageSquare, X } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { connectChatStomp, disconnectChatStomp } from '../lib/stompClient'
import { useChatOverlayStore } from '../lib/chatOverlayStore'
import { ChatHomeScreen } from './ChatHomeScreen'
import { ChatRoomDetailPanel } from './ChatRoomDetailPanel'

/**
 * 채팅 오버레이 진입점(팝업 → 인앱 오버레이 전환). `LayoutShell` 최상위의 고정 자식으로 항상
 * 마운트되며, `isOpen`이 false면 `null`을 반환하는 조건부 마운트 컴포넌트다 — CSS로 숨기는
 * 방식이 아니라, `isOpen` 전환 자체가 아래 `ChatOverlayPanelContent`의 실제 React 마운트/언마운트를
 * 일으키도록 구성해 그 mount/unmount를 STOMP 생명주기(CONNECT/DISCONNECT) 트리거로 재사용한다
 * (옛 `ChatWindowLayout`의 "팝업 열림/닫힘" 트리거를 "React 마운트/언마운트"로 그대로 대응).
 *
 * `LayoutShell`이 이미 `ProtectedRoute` 하위에서만 렌더되므로(인증 보장) 이 컴포넌트는 별도
 * auth 분기를 두지 않는다. 팝업 전용이던 `beforeunload` 안전망도 두지 않는다 — 오버레이가
 * 닫힐 때는 항상 진짜 React 언마운트가 보장되고, 탭 종료/새로고침 시엔 WebSocket도 JS 컨텍스트와
 * 함께 죽으므로 그 안전망의 존재 근거가 사라졌다.
 */
export function ChatOverlayPanel() {
  const isOpen = useChatOverlayStore((state) => state.isOpen)

  if (!isOpen) {
    return null
  }

  return <ChatOverlayPanelContent />
}

function ChatOverlayPanelContent() {
  const screen = useChatOverlayStore((state) => state.screen)
  const selectedRoomId = useChatOverlayStore((state) => state.selectedRoomId)
  const close = useChatOverlayStore((state) => state.close)

  useEffect(() => {
    connectChatStomp()
    return () => {
      disconnectChatStomp()
    }
  }, [])

  return (
    // 우하단에 떠 있는 고정 패널. bg-card로 배경 페이지(bg-muted/30 main) 위에 살짝 떠오른 표면
    // 위계를 주고(다크모드에선 card가 background보다 밝아 자연 대응), 진입 시 slide-up+fade로
    // 부드럽게 나타난다. 닫힘은 이 컴포넌트가 조건부로 언마운트(null 반환)되는 구조라 exit
    // 애니메이션은 로직(STOMP 생명주기) 변경 없이는 불가하므로 진입 애니메이션만 적용한다.
    <div className="fixed right-4 bottom-4 z-50 flex h-[760px] max-h-[calc(100vh-2rem)] w-[420px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl duration-200 animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2">
      {/* 오버레이 크롬 헤더: 앱 레벨 제목(채팅) + 닫기. 목록/상세 전환과 무관하게 상시 유지된다. */}
      <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border px-4">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <MessageSquare className="size-4" aria-hidden="true" />
          </span>
          <span className="text-sm font-semibold">채팅</span>
        </div>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="채팅 닫기" onClick={close}>
          <X aria-hidden="true" />
        </Button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
        {/* screen==='room'인데 selectedRoomId가 없는 상태는 정상 흐름에서 발생하지 않는다
            (모든 room 진입 경로가 selectRoom을 거쳐 둘을 함께 세팅) — 방어적으로 홈 화면 폴백한다. */}
        {screen === 'home' || selectedRoomId === null ? (
          <ChatHomeScreen />
        ) : (
          <ChatRoomDetailPanel roomId={selectedRoomId} />
        )}
      </div>
    </div>
  )
}
