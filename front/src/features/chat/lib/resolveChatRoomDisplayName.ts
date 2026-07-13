/** 폴백할 참여자 이름조차 없을 때(참여자가 본인뿐인 방 등) 쓰는 최종 표시명. */
const EMPTY_ROOM_NAME = '이름 없는 채팅방'

/**
 * 채팅방 표시명 폴백 계산(도메인 규칙: 채팅방 이름 기본값은 null이며, view에서는 참여자 이름이
 * 보여진다). 커스텀 표시명(`roomName`)이 있으면 그대로 쓰고, 없으면 참여자 이름 목록으로 표시명을
 * 합성한다.
 *
 * - `roomName`이 공백이 아닌 문자열이면 그대로 반환한다.
 * - 없으면 `participantNames`(본인 제외)로 조합한다: 앞 `maxNames`명을 ', '로 잇고, 남는 인원이
 *   있으면 ' 외 M명'을 덧붙인다(예: '김영희, 김철수 외 3명'). 이름이 `maxNames` 이하면 전부 나열한다.
 * - `participantNames`가 비어 있으면 '이름 없는 채팅방'을 반환한다.
 *
 * 목록 화면은 `ChatRoomListItem.participantNames`를, 상세 화면은 `members`에서 본인을 제외한
 * 이름 배열을 만들어 넘긴다.
 */
export function resolveChatRoomDisplayName(
  roomName: string | null | undefined,
  participantNames: string[] | null | undefined,
  maxNames = 2,
): string {
  const trimmed = roomName?.trim()
  if (trimmed) {
    return trimmed
  }
  // 방어: 계약상 서버가 항상 배열을 주지만, 구버전 응답 등으로 필드가 없어도(null/undefined)
  // 런타임 오류 없이 최종 폴백 문구로 떨어지게 한다.
  const names = participantNames ?? []
  if (names.length === 0) {
    return EMPTY_ROOM_NAME
  }
  const shown = names.slice(0, maxNames)
  const remaining = names.length - shown.length
  const base = shown.join(', ')
  return remaining > 0 ? `${base} 외 ${remaining}명` : base
}
