import { Client } from '@stomp/stompjs'
import { getAccessToken } from '@/shared/api/tokenStore'
import { setChatStompStatus } from './chatConnectionStatus'

/**
 * 채팅 창 전용 단일 STOMP 클라이언트 CONNECT 인프라(ROADMAP(CHAT) T0.4-a) +
 * 연결 상태 노출/종료 정리(T0.4-b).
 *
 * chat-stomp.md(연결·인증) 계약:
 * - 엔드포인트 `ws://localhost:8080/ws-chat` (SockJS 미사용 — 순수 WebSocket).
 * - CONNECT 프레임의 **네이티브 헤더** `Authorization: Bearer <accessToken>`로 인증
 *   (쿼리 파라미터/쿠키 아님).
 *
 * WHY 지연 생성(lazy singleton): 이 모듈은 팝업 창 부팅 초기(App.tsx 마운트 시점)에 이미
 * import 그래프에 포함될 수 있는데, 그 시점엔 아직 인증(T0.3 reissue→me)이 끝나지 않아
 * tokenStore에 accessToken이 없다. 모듈 최상단에서 즉시 `new Client(...)`를 만들면
 * `Authorization: Bearer null`을 캡처해버리므로, 인증 완료 후 최초로 연결을 시도하는 시점
 * (connectChatStomp 최초 호출)에만 생성해 그 시점의 실제 accessToken을 담는다.
 *
 * WHY `reconnectDelay: 0`(자동 재연결 명시 비활성화): @stomp/stompjs Client는 옵션을 주지
 * 않으면 기본값 5000(ms)으로 자동 재연결이 켜진 채 생성된다(code-reviewer 지적). 자동
 * 재연결은 최초 CONNECT 시점에 정적으로 캡처한 `connectHeaders`(토큰)를 그대로 재사용해
 * 만료된 토큰으로 무한 재시도할 수 있으므로, `reconnectDelay: 0`으로 자동 재연결 자체를 끄고
 * 재연결 트리거 여부·시점은 이 모듈이 명시적으로 제어한다(아래 onWebSocketClose의 Open Q#6
 * //todo 참조 — 정책 자체는 아직 미확정).
 *
 * 연결 상태(`ChatStompStatus`)는 `chatConnectionStatus.ts`가 정의하고, 이 모듈의 Client
 * 콜백(`onConnect`/`onWebSocketClose`)과 `connectChatStomp`가 그 상태를 갱신한다.
 */

const CHAT_WS_URL = 'ws://localhost:8080/ws-chat'

let chatStompClient: Client | null = null

/**
 * 채팅 창 단일 STOMP 클라이언트 인스턴스를 반환한다(모듈 스코프 싱글턴, 최초 호출 시 생성).
 * 이후 T2.3-a(SUBSCRIBE lifecycle) 등 다른 소비처도 이 함수로 동일 인스턴스를 공유해야 한다
 * (또 다른 `new Client(...)`를 만들지 않는다).
 */
export function getChatStompClient(): Client {
  chatStompClient ??= new Client({
    brokerURL: CHAT_WS_URL,
    connectHeaders: { Authorization: `Bearer ${getAccessToken() ?? ''}` },
    // 자동 재연결 명시 비활성화(위 WHY 참조) — 재연결 정책은 이 파일이 직접 제어한다.
    reconnectDelay: 0,
    onConnect: () => {
      setChatStompStatus('connected')
    },
    // onWebSocketClose는 정상 DISCONNECT·네트워크 끊김·서버 강제 종료를 모두 포함해 소켓이
    // 닫히는 모든 경우에 호출되므로(onDisconnect는 정상 DISCONNECT 왕복 완료 시에만 호출),
    // "끊김" 신호의 단일 진입점으로 이것만 사용한다.
    onWebSocketClose: () => {
      setChatStompStatus('disconnected')
      // todo: Open Q#6(docs/prd/9.chat-prd.md, ROADMAP(CHAT).md T0.4-b) 미확정 — access
      // token 만료(30분) 등으로 연결이 끊겼을 때 재CONNECT를 자동으로 트리거할지, 트리거한다면
      // 어떤 조건(토큰 만료 감지 방식: 만료 임박 타이머 vs 재연결 시도 시 401 등)으로 판단할지
      // 정책이 확정돼 있지 않다. 정책이 확정되면 여기서 감지 로직을 추가해 갱신된 토큰으로
      // 재연결해야 한다(임의 확정 금지). 주의: `reconnectDelay: 0`이라 onWebSocketClose
      // 시점엔 client.active가 여전히 true로 남아 있어(deactivate()를 아무도 호출하지
      // 않았으므로) connectChatStomp()만 다시 불러서는 activate()가 no-op이라 재연결되지
      // 않는다 — 반드시 disconnectChatStomp()로 client를 INACTIVE로 되돌린 뒤
      // connectChatStomp()를 호출해야 갱신된 토큰으로 새 connectHeaders가 구성된다
      // (code-reviewer 지적, T0.4-b).
    },
  })
  return chatStompClient
}

/**
 * 인증 완료 후 채팅 STOMP 클라이언트 CONNECT를 시도한다. 호출 시점의 tokenStore
 * accessToken으로 Authorization 헤더를 구성하므로, 인증(T0.3) 완료 후에만 호출해야 한다.
 *
 * `activate()`는 클라이언트가 이미 ACTIVE 상태면 아무 것도 하지 않는 내부 가드가 있어(
 * @stomp/stompjs Client#activate), 인증 상태 변화(예: React effect 재실행)로 여러 번
 * 호출돼도 안전하다. 상태를 `connecting`으로 갱신하는 것도 아직 활성화 전(`!client.active`)
 * 일 때만 수행해, 이미 연결된 클라이언트에 재호출됐을 때 상태가 `connected`에서 잘못
 * `connecting`으로 되돌아가지 않게 한다(activate()가 no-op이라 이후 onConnect가 다시 불리지
 * 않으므로, 여기서 무조건 'connecting'을 세팅하면 영영 'connecting'에 머무는 버그가 된다).
 */
export function connectChatStomp(): void {
  const client = getChatStompClient()
  if (!client.active) {
    setChatStompStatus('connecting')
  }
  client.activate()
}

/**
 * 채팅 창 종료(unmount/beforeunload) 시 STOMP 연결을 정리한다(ROADMAP(CHAT) T0.4-b).
 * 클라이언트가 아직 생성된 적 없으면 아무 것도 하지 않는다. 창이 실제로 닫히는 상황이라
 * 브로커의 정상 DISCONNECT 응답을 기다릴 시간이 보장되지 않으므로 `force: true`로 즉시
 * 언더레잉 WebSocket을 닫는다(@stomp/stompjs Client#deactivate).
 */
export function disconnectChatStomp(): void {
  if (!chatStompClient) return
  void chatStompClient.deactivate({ force: true })
}
