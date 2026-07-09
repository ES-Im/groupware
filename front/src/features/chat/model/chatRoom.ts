/**
 * chat 도메인 모델 — 내 채팅방 목록 아이템(`CHAT_ROOM_LIST`, ROADMAP(CHAT) T1.1, F901).
 * 필드는 back/build/generated-snippets/CHAT_ROOM_LIST/response-fields.adoc 실측(재서술 금지).
 * 응답은 Spring Page가 아닌 plain array다 — 이 타입은 배열의 원소 1건을 가리킨다.
 */
export interface ChatRoomListItem {
  chatRoomId: number
  /**
   * 채팅방 표시명.
   * //todo Open Q#3(PRD §❓): 도메인모델상 커스텀 표시명 기본값은 null이고 참여자 소속·이름으로
   * 폴백 표시하나, 목록 응답에는 폴백용 참여자 이름 정보가 없어(joinedMemberCount만 존재) 서버가
   * 이미 합성된 표시명을 내려주는지(null 안 옴)가 미확정이다. 확정 전까지 스니펫 실측값(string)을
   * 그대로 따르고 null 폴백 로직은 임의로 발명하지 않는다.
   */
  roomName: string
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
}
