/**
 * chat 도메인 모델 — 내 채팅방 목록 아이템(`CHAT_ROOM_LIST`, ROADMAP(CHAT) T1.1, F901).
 * 필드는 back/build/generated-snippets/CHAT_ROOM_LIST/response-fields.adoc 실측(재서술 금지).
 * 응답은 Spring Page가 아닌 plain array다 — 이 타입은 배열의 원소 1건을 가리킨다.
 */
export interface ChatRoomListItem {
  chatRoomId: number
  /**
   * 채팅방 표시명(멤버별 커스텀 이름). 도메인 규칙상 기본값은 null이며(미설정),
   * `.optional()` 실측대로 null이 온다. null일 때는 화면에서 `participantNames`로 폴백 표시한다
   * (`resolveChatRoomDisplayName`). "view에서는 참여자 소속·이름이 보여진다"는 도메인 규칙을
   * 충족하기 위해 목록 응답에도 참여자 이름(`participantNames`)을 함께 내려받는다.
   */
  roomName: string | null
  /** 아직 메시지가 없는 새 방 등에서 null(`ChatApiDocsTest.java` getMyJoinedChatRooms() 실측, optional). */
  lastMessageContent: string | null
  /** 'yyyy-MM-dd\'T\'HH:mm:ss' 포맷 문자열. 메시지 없는 새 방 등에서 null. dayjs 파싱/표기는 소비 화면(T1.2)에서 null 방어 후 처리한다. */
  lastMessagedAt: string | null
  /** 메시지가 없는 새 방 등에서 null(백엔드 optional 실측). 소비처에서 null을 0으로 취급한다. */
  unreadMessageCount: number | null
  isGroup: boolean
  /** 마지막 메시지로부터 30일 경과 시 true(도메인모델) — 소비 화면에서 흐림 표시. */
  isPastRoom: boolean
  isBookmarked: boolean
  joinedMemberCount: number
  /**
   * 참여자 이름 목록(본인 제외, 참여 순). `roomName`이 null일 때 표시명 폴백에 쓴다
   * (도메인모델: 채팅방 이름 기본값 null → view에서 참여자 소속·이름 표시). 서버가 항상 배열로
   * 내려준다(참여자가 본인뿐이면 빈 배열).
   */
  participantNames: string[]
}
