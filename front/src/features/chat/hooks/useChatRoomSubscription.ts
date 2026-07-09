import { useEffect, useRef } from 'react'
import type { InfiniteData } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useChatStompStatus } from '../lib/chatConnectionStatus'
import { parseChatBroadcastMessage } from '../lib/parseChatBroadcastMessage'
import { getChatStompClient } from '../lib/stompClient'
import { upsertChatMessage } from '../lib/upsertChatMessage'
import type { ChatMessagesPage } from '../model/chatMessage'
import { chatKeys } from '../model/queryKeys'

/**
 * 채팅방 대화 화면 방 토픽 SUBSCRIBE/UNSUBSCRIBE lifecycle + 수신 append/dedup
 * (ROADMAP(CHAT) T2.3-a·T2.3-b, F904, docs/backend-contract/chat-stomp.md §허용된 목적지).
 *
 * `roomId`가 유효하고 STOMP 연결 상태(T0.4-b `useChatStompStatus`)가 `connected`일 때만
 * `/topic/chat/rooms/{roomId}`를 구독한다(연결이 아직 안 됐거나 끊긴 상태에서는 구독을
 * 시도하지 않는다 — chat-stomp.md상 SUBSCRIBE도 CONNECT 이후에만 유효). `roomId`가
 * 바뀌거나(방 전환) 컴포넌트가 언마운트되거나(방 이탈) 연결이 끊기면 effect cleanup에서
 * 반드시 이전 구독을 UNSUBSCRIBE해, 방 전환 후에도 이전 방 토픽 구독이 남아있는 상황(PRD
 * Open Q#6)을 방지한다(T2.3-a).
 *
 * 수신 프레임은 `parseChatBroadcastMessage`로 파싱한 뒤 `upsertChatMessage`로
 * `chatKeys.messages(roomId)` 무한쿼리 캐시에 직접 반영한다(`queryClient.setQueryData` —
 * invalidate 후 재조회는 실시간성이 떨어져 지양). 동일 `clientMessageId`가 이미 캐시에 있으면
 * (T2.4 낙관 렌더 메시지) append 대신 그 자리를 교체해 dedup한다(T2.3-b). 브로드캐스트 프레임
 * 스키마(PRD Open Q#5)는 T2.4 실제 백엔드 연동 검증 중 실측으로 확정됐다 — 더는 가정이 아니다
 * (parseChatBroadcastMessage.ts 상단 주석 참조).
 *
 * 발신(T2.4)·읽음 갱신(T2.5)은 이 훅의 범위가 아니다.
 */
export function useChatRoomSubscription(roomId: number | undefined): void {
  const stompStatus = useChatStompStatus()
  const queryClient = useQueryClient()
  // 비멤버·종료방 등으로 서버가 STOMP ERROR로 거부한 방은, 이 훅 인스턴스가 살아있는 동안은
  // 연결 상태가 다시 connected로 바뀌더라도 재구독을 시도하지 않는다.
  // todo: Open Q#6(재연결 정책 미확정) — 자동 재연결이 도입되면 이 ref가 "가장 최근 거부된 방
  // 1개"만 기억하는 한계를 재검토해야 한다. 방 A 거부 → 방 B로 전환·B도 거부 → 다시 A로
  // 전환하면 ref는 B만 남아있어 A 재구독을 막지 못한다(다중 거부 이력 유실). 현재는 자동
  // 재연결이 없어(reconnectDelay: 0) 실무 노출이 낮지만, Set<number>로 바꾸는 등의 재설계가
  // 필요할 수 있다(code-reviewer 지적, T2.3-b).
  // T2.4(SEND) 재검토: SEND는 항상 "현재 이 훅이 구독 중인 방"에만 발생한다(아래
  // client.onStompError 주석 참조 — ChatMessageInput→useSendChatMessage는 이 roomId로만
  // publish) — 즉 이 ref가 다루는 "거부된 방" 후보 집합의 성격 자체는 SEND 도입으로 달라지지
  // 않는다. 위 한계(다중 거부 이력 유실)의 실무 위험도가 SEND로 인해 커지지 않는다고 판단해
  // 지금 단계에서는 손대지 않는다(과잉 설계 금지 — Set<number> 전환은 여전히 Open Q#6 확정 시로 보류).
  const rejectedRoomIdRef = useRef<number | null>(null)

  useEffect(() => {
    if (roomId === undefined || stompStatus !== 'connected') {
      return
    }
    if (rejectedRoomIdRef.current === roomId) {
      return
    }

    const client = getChatStompClient()
    const subscription = client.subscribe(`/topic/chat/rooms/${roomId}`, (frame) => {
      const incoming = parseChatBroadcastMessage(frame.body)
      if (!incoming) {
        return
      }
      queryClient.setQueryData<InfiniteData<ChatMessagesPage>>(chatKeys.messages(roomId), (old) =>
        upsertChatMessage(old, incoming),
      )
    })

    // STOMP ERROR 프레임은 구독 단위가 아니라 커넥션(Client) 단위 콜백으로만 전달된다(SUBSCRIBE
    // 거부는 STOMP 프로토콜상 ERROR 프레임 + 연결 종료로 이어지는 것이 일반적이다). 이 방을 보고
    // 있는 동안만 등록해 두고, 방을 벗어나면(effect cleanup) 다시 no-op으로 되돌린다.
    // getChatStompClient()는 채팅 창 전역 싱글턴이라 onStompError를 이 훅의 effect가 통째로
    // 재할당·복원한다 — 이 훅이 이 콜백의 유일한 소비자라는 전제 위에서만 안전하다.
    // T2.4(SEND) 재검토 결론: useSendChatMessage는 이 콜백을 별도로 재할당하지 않는다(publish()의
    // 동기 예외만 로컬 try/catch로 자체 처리 — useSendChatMessage.ts 상단 WHY 참조). SEND 거부
    // (STOMP ERROR)도 결국 이 콜백으로만 전달되므로, SEND 도입 후에도 이 콜백의 소비자는 여전히
    // 이 훅 하나뿐이라 재할당 충돌은 발생하지 않는다.
    // todo: 향후 다른 소비자(예: 전역 알림·다른 화면)가 client.onStompError를 함께 다루게 되면,
    // 나중에 mount된 effect가 앞선 핸들러를 덮고 cleanup의 no-op 복원이 다른 쪽의 활성 핸들러를
    // 지우는 충돌이 발생한다(code-reviewer 지적, T2.3-b) — 그때는 단일 재할당 방식을 재검토해야 한다.
    client.onStompError = (frame) => {
      rejectedRoomIdRef.current = roomId
      // todo: ERROR 프레임의 헤더/바디 스키마가 chat-stomp.md에 문서화돼 있지 않아(Open Q#5
      // 연장선) 비멤버 접근·종료방 접근 등 구체 사유를 구분할 수 없다. 서버가 내려준 message
      // 헤더가 있으면 그대로 보여주고, 없으면 범용 안내로 대체한다.
      // T2.4(SEND) 착수 시 재검토 결론: 이 앱 UI에는 "현재 보고 있는(=이 훅이 구독 중인) 방"에만
      // SEND하는 경로만 존재한다(ChatMessageInput→useSendChatMessage는 항상 이 roomId로만
      // publish, 다른 방으로 SEND하는 UI 경로 없음) — 즉 이 콜백이 살아있는 동안 발생하는 ERROR는
      // SUBSCRIBE 거부든 이 방으로의 SEND 거부든 항상 "이 roomId"에 대한 것이므로, "이 방의 영구
      // 거부"로 귀속하는 것 자체는 SEND 도입 후에도 여전히 유효하다.
      // todo: 다만 ERROR 프레임 스키마 미문서화(Open Q#5)로 "이 방과 무관한 일시적 커넥션 오류"가
      // 섞여 들어와도 이 콜백은 구분할 수 없어 똑같이 "이 방 영구 거부"로 처리하는 잔여 리스크는
      // T2.4 이후에도 남아있다 — 스키마 정보 없이 클라이언트가 사유를 임의로 구분하는 것은 발명이라
      // (과잉 설계 금지), Open Q#5가 확정되기 전까지는 귀속 로직을 더 손대지 않는다(재검토 완료).
      toast.error(frame.headers.message ?? '채팅방에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.')
    }

    return () => {
      subscription.unsubscribe()
      client.onStompError = () => {}
    }
  }, [roomId, stompStatus, queryClient])
}
