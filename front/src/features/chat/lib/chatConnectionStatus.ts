import { create } from 'zustand'

/**
 * 채팅 창 STOMP 연결 상태(ROADMAP(CHAT) T0.4-b).
 *
 * T0.4-a가 만든 단일 STOMP 클라이언트(`stompClient.ts`)의 연결/끊김 상태를 zustand 스토어로
 * 노출해, 소비처(예: T2.3-a의 SUBSCRIBE lifecycle이 "연결됨"을 구독 게이팅 조건으로 사용)가
 * `useChatStompStatus()` 훅으로 구독할 수 있게 한다(CLAUDE.md §6 클라이언트 상태: zustand,
 * authStore.ts와 동일한 스토어 패턴).
 *
 * 상태 전이는 이 모듈이 아니라 `stompClient.ts`가 소유한다(Client 콜백 `onConnect`/
 * `onWebSocketClose`, `connectChatStomp` 호출부에서 `setChatStompStatus`를 호출해 갱신) —
 * 이 파일은 "무엇을 노출하는지"만 정의한다.
 */
export type ChatStompStatus = 'idle' | 'connecting' | 'connected' | 'disconnected'

interface ChatStompStatusState {
  status: ChatStompStatus
}

const useChatStompStatusStore = create<ChatStompStatusState>(() => ({
  status: 'idle',
}))

export function setChatStompStatus(status: ChatStompStatus): void {
  useChatStompStatusStore.setState({ status })
}

/** 채팅 창 STOMP 연결 상태를 구독한다. 소비처(T2.3-a 등)의 단일 진입점. */
export function useChatStompStatus(): ChatStompStatus {
  return useChatStompStatusStore((state) => state.status)
}
