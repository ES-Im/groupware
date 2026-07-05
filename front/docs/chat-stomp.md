### 채팅 (STOMP over WebSocket)



#### 연결(엔드포인트)

- `ws://localhost:8080/ws-chat` (SockJS 미사용 — 순수 WebSocket)



#### 인증

- `connectHeaders = { Authorization: 'Bearer ' + accessToken }`
- STOMP **CONNECT 프레임의 네이티브 헤더** `Authorization: Bearer <accessToken>`로 전달. (쿼리 파라미터/쿠키 아님)
- CONNECT 시 access token 검증, SEND/SUBSCRIBE 시 채팅방 멤버십까지 검증.



#### prefix

- 발행(SEND) `/app`, 구독(SUBSCRIBE) 브로커 `/topic`·`/queue`, 개인 목적지 `/user`



#### 허용된 목적지 (정규식으로 엄격 검증 — 벗어나면 서버가 거부)

- 메시지 발행: `/app/chat/rooms/{roomId}/messages` (body: `ChatClientSend`)
- 방 구독: `/topic/chat/rooms/{roomId}`



#### 발행 body 스키마 (`ChatClientSend`)

- `clientMessageId`: **UUID** (필수, `@NotNull`). 중복 방지/낙관적 렌더링용. `crypto.randomUUID()`로 생성.
- `content`: 문자열 (필수, `@NotBlank`, **최대 2000자** `@Size(max=2000)`). 초과 시 서버 거부 → 프론트도 2000자 제한.

