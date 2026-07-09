/**
 * chat 도메인 모델 — 채팅방 상세(`CHAT_ROOM_DETAIL`, ROADMAP(CHAT) T2.1, F902).
 * 필드는 generated-snippets가 아직 생성돼 있지 않아(REST Docs 산출물 미빌드),
 * back/src/test/java/.../chat/ChatApiDocsTest.java의 chatRoomDetailFields()/chatRoomDetailResponse()
 * 실측(RestDocs FieldDescriptor 원본 — 스니펫과 동일한 사실 원천)을 그대로 따른다(재서술 금지).
 */
export interface ChatRoomDetail {
  roomId: number
  /**
   * 채팅방 표시명.
   * //todo Open Q#3(PRD §❓, chatRoom.ts의 ChatRoomListItem.roomName과 동일 이슈): RestDocs상
   * optional(null 가능)이나, 도메인모델 폴백 정책(참여자 소속·이름으로 표시)을 클라이언트가
   * 임의로 구현할지 서버가 이미 합성해 내려주는지 미확정이다. 확정 전까지 응답 문자열을 그대로
   * 따르고 members[] 기반 폴백 로직은 발명하지 않는다.
   */
  roomName: string
  isGroup: boolean
  /**
   * 마지막으로 읽은 채팅 메시지 식별 번호. RestDocs상 optional(null 가능) — 아직 아무 메시지도
   * 읽지 않은 상태(신규 참여 등)에서는 null일 수 있다(Open Q#3과 무관한 일반 nullable 필드).
   * T2.5(읽음 위치 갱신)가 실제로 소비한다.
   */
  lastReadMessageId: number | null
  members: ChatRoomMember[]
}

export interface ChatRoomMember {
  memberId: number
  /** 참여자 주 소속 부서명. RestDocs상 optional(null 가능) — 소속 없는 참여자 등. */
  deptName: string | null
  memberName: string
  /**
   * 참여자 프로필 이미지 미리보기 URL(예: `/api/employees/1/files/7/preview`). RestDocs상
   * optional(null 가능) — 프로필 사진 미등록 참여자는 null. 인증 필요 경로라 `<img src>` 직접
   * 사용 불가 → `BlobAvatar`(blob fetch)로만 렌더한다(lib/parseEmpFilePreviewFileId 참조).
   */
  profileImageUrl: string | null
}
