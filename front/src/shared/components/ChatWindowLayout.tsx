import { useEffect } from 'react'
import { Outlet } from 'react-router'
import { useAuthStore } from '@/features/auth/store/authStore'
import { connectChatStomp, disconnectChatStomp } from '@/features/chat/lib/stompClient'

/**
 * 채팅 창 전용 레이아웃(ROADMAP(CHAT) T0.1). `router.tsx`에서 메인 `LayoutShell`과 형제인
 * 최상위 라우트(`/chat`, `/chat/rooms/:roomId`)의 부모로 쓰인다. 헤더 말풍선 아이콘이
 * `window.open('/chat', 'haruon-chat', 'popup,...')`으로 띄우는 별도 팝업 창 전체를 차지하는
 * "별도 서비스인 척" UX(채팅 PRD §🪟)이므로, 메인 셸의 Header/Sidebar/Footer를 렌더하지 않고
 * Outlet 자식만 그리는 최소 크롬으로 둔다.
 *
 * 실제 목록/대화 패널은 M1~M2에서 이 Outlet 안에 채워진다.
 *
 * ### 인증 게이트(ROADMAP(CHAT) T0.3)
 * 팝업은 `index.html`을 새로 로드하므로 `main.tsx` → `App.tsx`가 매번 새로 마운트되고,
 * `App`이 무조건 호출하는 `useBootstrapAuth()`가 이미 reissue → `RETRIEVE_ME_INFO` 부팅
 * 시퀀스를 자동으로 재실행해 `authStore.status`를 `idle → authenticated/unauthenticated`로
 * 전이시킨다. 즉 부팅 시퀀스 자체는 별도 구현 없이 팝업에서도 재사용된다.
 *
 * 이 레이아웃은 `ProtectedRoute`(`@/shared/components/ProtectedRoute.tsx`)의 상태 분기
 * 패턴을 복제해 `status`를 구독하지만, `unauthenticated`일 때 `<Navigate to="/login" />`로
 * 리디렉션하지는 않는다. 팝업 창은 메인 셸 라우팅과 완전히 분리돼 있어 `/login`으로 보내면
 * 팝업 안에 메인 로그인 페이지가 뜨는 어색한 UX가 되기 때문이다. 최종 UX(팝업 내 로그인 폼 vs
 * 팝업을 닫고 부모 창 로그인 유도)는 채팅 PRD Open Q#1이 미확정이므로, 여기서는 분기 지점만
 * 확보하고 확정하지 않는다.
 *
 * ### STOMP CONNECT(ROADMAP(CHAT) T0.4-a)
 * `status`가 `authenticated`로 전이되는 순간(=인증 완료 후에만) 채팅 창 전용 단일 STOMP
 * 클라이언트(`@/features/chat/lib/stompClient`)의 CONNECT를 시도한다. 연결/끊김 상태는
 * `useChatStompStatus()`(`@/features/chat/lib/chatConnectionStatus`)로 소비처가 별도 구독한다.
 *
 * ### STOMP 종료 정리(ROADMAP(CHAT) T0.4-b)
 * 채팅 창(팝업)이 닫힐 때 STOMP DISCONNECT를 정리하기 위해 `beforeunload`를 구독한다.
 * 브라우저 탭/팝업이 닫히는 시점은 React 컴포넌트 unmount 라이프사이클이 보장되지 않으므로
 * (JS 컨텍스트 자체가 즉시 파기될 수 있음), `beforeunload`가 "창 닫힘"을 감지하는 신뢰 가능한
 * 신호다. 동시에 컴포넌트가 실제로 unmount되는 경우(예: 개발 모드 StrictMode 이중 마운트, 향후
 * 라우팅 구조 변경)에 대비해 effect cleanup에서도 동일하게 정리한다. 토큰 만료 시 재CONNECT
 * 정책(Open Q#6)은 여전히 미확정이며, 그 트리거 지점은 `stompClient.ts`의
 * `onWebSocketClose` `//todo`에 확보돼 있다(임의 확정 금지).
 */
export function ChatWindowLayout() {
  const status = useAuthStore((state) => state.status)

  useEffect(() => {
    if (status === 'authenticated') {
      connectChatStomp()
    }
  }, [status])

  useEffect(() => {
    window.addEventListener('beforeunload', disconnectChatStomp)
    return () => {
      window.removeEventListener('beforeunload', disconnectChatStomp)
      disconnectChatStomp()
    }
  }, [])

  if (status === 'idle') {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-background">
        <div role="status">로딩 중...</div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    // todo: Open Q#1(채팅 PRD, docs/prd/9.chat-prd.md) 미확정 — 팝업 내 로그인 폼 vs
    // 팝업을 닫고 부모 창 로그인 유도 중 UX 확정 후 이 분기를 실제 컴포넌트로 교체한다.
    // 임의 확정 금지(ROADMAP(CHAT).md T0.3).
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-background">
        <p role="status">로그인이 필요합니다.</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <Outlet />
    </div>
  )
}
