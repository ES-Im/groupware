import type { InfiniteData } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { toast } from 'sonner'
import { useMeQuery } from '@/features/employee/api/useMeQuery'
import { useChatStompStatus } from '../lib/chatConnectionStatus'
import { removeChatMessage } from '../lib/removeChatMessage'
import { getChatStompClient } from '../lib/stompClient'
import { upsertChatMessage } from '../lib/upsertChatMessage'
import type { ChatMessage, ChatMessagesPage } from '../model/chatMessage'
import { chatKeys } from '../model/queryKeys'

/** `ChatClientSend.content` 서버 제약(`@Size(max=2000)`, chat-stomp.md §발행 body 스키마) 클라 사전 방어. */
export const CHAT_MESSAGE_MAX_LENGTH = 2000

/**
 * 낙관 렌더용 임시 메시지 id 채번기(ROADMAP(CHAT) T2.4).
 *
 * 서버가 확정한 메시지의 `id`는 항상 양의 정수(DB PK)이므로 음의 정수를 쓰면 실제 id와 절대
 * 충돌하지 않는다. 이 값은 SEND payload(`ChatClientSend`)에는 실리지 않고(서버로는
 * `clientMessageId`만 전송) 오직 프론트 렌더링(React key)·"아직 서버 확정 전(pending)" 판별용으로만
 * 쓰인다. 확정되면 `upsertChatMessage`(T2.3-b)가 동일 `clientMessageId` 자리를 서버가
 * 내려준 양의 id를 포함한 값으로 통째로 교체하므로, 이 카운터 값 자체는 화면에 영속되지 않는다.
 */
let nextOptimisticMessageId = -1

/**
 * 메시지 발신(F905, ROADMAP(CHAT) T2.4). `SEND /app/chat/rooms/{roomId}/messages` 전송과
 * 동시에 낙관 렌더를 수행하고, T2.3-b가 이미 제공하는 `upsertChatMessage`(`clientMessageId`
 * dedup)에 그대로 태운다 — 브로드캐스트 echo가 동일 `clientMessageId`로 도착하면
 * `useChatRoomSubscription`(T2.3-b)의 수신 처리 경로가 이 자리를 서버 확정값으로 자동 교체하므로,
 * 별도의 "발신 확정" 로직을 이 훅에서 새로 만들지 않는다.
 *
 * 클라 사전 검증(2000자 초과·공백만 있는 입력 — `@NotBlank` 방어)과 STOMP 미연결 상태는 이
 * 훅에서 차단하고 토스트로 안내한다(각각 실패 시 `sendMessage`는 false를 반환해 호출부가 입력을
 * 비우지 않고 유지하게 한다).
 *
 * 종료방/비멤버 등 서버측 SEND 거부(STOMP ERROR)는 이 훅이 직접 처리하지 않는다 — chat-stomp.md상
 * STOMP ERROR 프레임은 SUBSCRIBE 거부와 마찬가지로 구독 단위가 아닌 **커넥션 단위**로만 전달되고,
 * `useChatRoomSubscription`(T2.3-b)이 그 방을 보고 있는 동안 이미 `client.onStompError`를 등록해
 * 안내 토스트를 띄운다. 이 앱은 사용자가 항상 "현재 보고 있는(=구독 중인) 방"에만 SEND할 수 있어
 * (다른 방에 SEND하는 UI 경로가 없다), SEND 거부로 발생한 ERROR 프레임도 그 방의
 * `useChatRoomSubscription` 인스턴스가 이미 등록해둔 동일 콜백으로 수신돼 동일하게 안내된다 —
 * 이 훅이 `client.onStompError`를 별도로 재할당하면 두 소비자가 서로 콜백을 덮어써 충돌하므로
 * (code-reviewer 지적, T2.3-b) 의도적으로 건드리지 않는다(T2.4 재검토 결론 — 발명 금지, 과잉 설계 금지).
 * `publish()` 자체가 동기적으로 던지는 클라이언트측 예외(예: `stompStatus` zustand 미러와 실제
 * `client.connected`가 어긋나는 좁은 레이스에서 비활성 클라이언트에 호출)만 아래 try/catch로 로컬
 * 처리한다 — 이 경우 SEND 자체가 브로커에 전달되지 못한 것이 확실하므로(code-reviewer 지적),
 * 방금 넣은 낙관 메시지를 `removeChatMessage`로 롤백하고 다른 실패 경로와 동일하게 `false`를
 * 반환해 `ChatMessageInput`이 입력값을 유지하게 한다.
 */
export function useSendChatMessage(roomId: number) {
  const stompStatus = useChatStompStatus()
  const queryClient = useQueryClient()
  const meQuery = useMeQuery()

  function sendMessage(rawContent: string): boolean {
    const content = rawContent.trim()
    if (!content) {
      return false
    }
    if (content.length > CHAT_MESSAGE_MAX_LENGTH) {
      toast.error(`메시지는 ${CHAT_MESSAGE_MAX_LENGTH}자를 초과할 수 없습니다.`)
      return false
    }
    if (stompStatus !== 'connected') {
      toast.error('연결이 끊어져 메시지를 보낼 수 없습니다. 잠시 후 다시 시도해주세요.')
      return false
    }
    const me = meQuery.data?.empBasicInfo
    if (!me) {
      // 채팅 창은 인증 완료 후에만 렌더되므로(T0.3) 실무상 거의 발생하지 않지만, me 조회가
      // 아직 캐시에 없는 과도기라면 발신자 정보 없이 낙관 메시지를 만들 수 없어 차단한다
      // (DrafterActions의 fail-closed 컨벤션과 동일).
      toast.error('사용자 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.')
      return false
    }

    const clientMessageId = crypto.randomUUID()
    const optimisticMessage: ChatMessage = {
      id: nextOptimisticMessageId--,
      senderId: me.empId,
      clientMessageId,
      senderName: me.name,
      content,
      sentAt: dayjs().format('YYYY-MM-DDTHH:mm:ss'),
      // 본인 프로필 사진의 EMP_FILE_PREVIEW 경로를 여기서 즉석 조립하지 않는다(추측 금지) — 서버
      // 확정 echo가 도착하면 upsertChatMessage가 이 자리를 실제 profileImageUrl 포함 값으로
      // 교체하므로, 확정 전까지는 BlobAvatar가 이니셜 폴백을 보여준다.
      profileImageUrl: null,
    }

    queryClient.setQueryData<InfiniteData<ChatMessagesPage>>(chatKeys.messages(roomId), (old) =>
      upsertChatMessage(old, optimisticMessage),
    )

    try {
      getChatStompClient().publish({
        destination: `/app/chat/rooms/${roomId}/messages`,
        body: JSON.stringify({ clientMessageId, content }),
      })
    } catch {
      // SEND 자체가 브로커에 전달되지도 못했으므로(publish()의 동기 예외), 방금 넣은 낙관 메시지를
      // 그대로 두면 서버 echo 없이 "전송 중..." 상태로 캐시에 영구 잔류한다(서버 미영속이라 재조회
      // 해도 사라지지 않음) — removeChatMessage로 롤백하고, 연결 끊김 등 다른 실패 경로와 동일하게
      // false를 반환해 ChatMessageInput이 입력값을 비우지 않고 재시도할 수 있게 한다
      // (code-reviewer 지적).
      queryClient.setQueryData<InfiniteData<ChatMessagesPage>>(chatKeys.messages(roomId), (old) =>
        removeChatMessage(old, clientMessageId),
      )
      toast.error('메시지 전송에 실패했습니다. 다시 시도해주세요.')
      return false
    }

    return true
  }

  return { sendMessage }
}
