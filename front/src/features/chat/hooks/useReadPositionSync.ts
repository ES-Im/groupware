import { useEffect, useRef } from 'react'
import { useUpdateReadPositionMutation } from '../api/useUpdateReadPositionMutation'
import type { ChatMessage } from '../model/chatMessage'

/**
 * 읽음 위치 갱신 트리거(F911, ROADMAP(CHAT) T2.5). "방 진입 시"(T2.2 초기 로드 완료)와
 * "새 메시지 도달 시"(T2.3-b 실시간 수신)를 별도 분기로 구현하지 않는다 — 둘 다 결과적으로
 * "이 방에서 보유한 메시지 목록의 최신 확정 id가 갱신"되는 동일한 사건이라, 현재 보유한
 * `messages`에서 서버 확정(id > 0 — T2.4 낙관 메시지의 임시 음수 id는 아직 서버 미확정이라
 * 읽음 위치로 보낼 수 없다) 최대 id를 추적하는 단일 effect로 두 트리거를 통합한다(과잉 설계
 * 금지 — 두 경로를 각각 구현하면 동일 로직의 중복이 된다).
 *
 * 메시지 하나하나마다 무조건 PATCH를 호출하는 과도한 API 호출을 피하기 위해, 마지막으로
 * 갱신 요청한 (roomId, id) 쌍을 ref로 기억해 값이 실제로 "증가"할 때만 mutate한다. roomId를
 * 함께 기억하는 이유: 이 훅을 호출하는 ChatMessageArea는 방을 전환해도(라우트 파라미터만
 * 바뀜) 언마운트되지 않는 경우가 있어(상세가 이미 캐시에 있어 로딩 분기를 거치지 않는 경우),
 * roomId 비교 없이 id만 비교하면 이전 방보다 최신 메시지 id가 작은 새 방으로 전환했을 때
 * 읽음 위치 갱신이 누락될 수 있다.
 *
 * **동시 요청 코얼레싱(coalescing)**: 최대 id가 짧은 간격으로 연속 증가하면(예: 메시지가
 * 연달아 도착) mutate가 겹쳐 나갈 수 있는데, react-query의 mutate는 이전 요청을 취소하지
 * 않으므로 두 PATCH가 동시에 in-flight 상태가 될 수 있다. 백엔드
 * `ChatMember.changeLastMessage()`가 `GREATEST` 비교 없이 `this.lastReadMessage = message`로
 * 단순 SET하므로(도메인 소스 확인 — code-reviewer 지적), 나중에 보낸(더 큰 id) 요청이 먼저
 * 보낸 요청(더 작은 id)보다 먼저 완료되면 읽음 위치가 더 작은 id로 후퇴하는 실제 버그가 된다.
 * 이를 막기 위해 항상 "한 번에 하나의 요청만" 내보낸다: 요청이 in-flight인 동안 더 최신 id가
 * 생기면 즉시 보내지 않고 `pendingRef`에 "다음에 보낼 목표"로만 적재해두고, in-flight 요청이
 * 끝나면(`onSettled` — 성공/실패 무관) 적재된 목표가 있을 때만 그 값으로 이어서 한 번 더
 * 보낸다. 이 큐는 슬롯이 하나뿐이라(가장 최신 목표로 덮어쓰기) 중간 id들을 건너뛸 수 있지만,
 * 항상 "마지막으로 알려진 최신 id"가 결국 반영되므로 정확성엔 문제가 없다(읽음 위치는 최신값
 * 만 의미가 있어 중간값 스킵이 손실이 아니다).
 *
 * in-flight 요청이 끝나 적재된 목표를 이어 보낼 때는 `roomIdRef`(매 렌더 최신 roomId를 반영)와
 * 비교해 방이 그 사이 바뀌었는지 확인한다 — 일치하지 않으면 버린다. react-query의 mutate는
 * 항상 "현재 렌더에 바인딩된 roomId"로 나가므로, 이 훅 인스턴스가 더는 그 방을 대표하지 않는
 * 상태에서 이어 보내면 엉뚱한 방으로 PATCH가 나갈 위험이 있기 때문이다. 방이 바뀌었다면 새
 * 방은 자신의 최초 진입 시점에 이미 별도로 이 effect가 스스로 요청을 큐잉했을 것이므로 굳이
 * 이어받을 필요가 없다.
 *
 * 실패는 조용히 무시한다(사용자 액션이 아닌 백그라운드 동기화라 실패마다 토스트를 띄우면
 * 오히려 소음이 되고, 더 최신 id가 도달하면 다시 시도된다 — ROADMAP(CHAT) 비고: "서버 최종
 * 검증 신뢰", 재시도 정책까지 정교하게 만들 필요는 없다).
 */
export function useReadPositionSync(roomId: number, messages: ChatMessage[]): void {
  const { mutate } = useUpdateReadPositionMutation(roomId)

  // 렌더마다 최신값을 반영해두는 ref들 — in-flight 요청 완료 후 이어 보내는 로직은 effect 밖
  // (비동기 콜백)에서 실행되므로, 클로저에 갇힌 옛 값이 아니라 항상 "지금 이 훅 인스턴스가
  // 대표하는 방/mutate"를 참조해야 한다.
  const roomIdRef = useRef(roomId)
  roomIdRef.current = roomId
  const mutateRef = useRef(mutate)
  mutateRef.current = mutate

  const lastSyncedRef = useRef<{ roomId: number; messageId: number } | null>(null)
  const inFlightRef = useRef(false)
  const pendingRef = useRef<{ roomId: number; messageId: number } | null>(null)

  let latestConfirmedId: number | null = null
  for (const message of messages) {
    if (message.id > 0 && (latestConfirmedId === null || message.id > latestConfirmedId)) {
      latestConfirmedId = message.id
    }
  }

  useEffect(() => {
    if (latestConfirmedId === null) {
      return
    }
    const last = lastSyncedRef.current
    if (last && last.roomId === roomId && latestConfirmedId <= last.messageId) {
      return
    }
    lastSyncedRef.current = { roomId, messageId: latestConfirmedId }

    if (inFlightRef.current) {
      pendingRef.current = { roomId, messageId: latestConfirmedId }
      return
    }

    fireSync(latestConfirmedId)
  }, [roomId, latestConfirmedId])

  // targetRoomId는 받지 않는다 — 호출부(effect 본문·onSettled)가 이미 "지금 이 훅 인스턴스가
  // 대표하는 방(roomIdRef.current)"과 일치함을 확인한 뒤에만 이 함수를 부르므로, mutateRef가
  // 그 시점에 올바른 방으로 이미 바인딩돼 있다(파일 상단 WHY 참조).
  function fireSync(targetMessageId: number) {
    inFlightRef.current = true
    pendingRef.current = null
    mutateRef.current(targetMessageId, {
      onSettled: () => {
        inFlightRef.current = false
        const pending = pendingRef.current
        if (!pending || pending.roomId !== roomIdRef.current) {
          return
        }
        fireSync(pending.messageId)
      },
    })
  }
}
