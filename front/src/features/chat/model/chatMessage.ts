/**
 * chat 도메인 모델 — 채팅 메시지 목록 cursor 페이징 응답(`CHAT_MESSAGES`, ROADMAP(CHAT) T2.2, F903).
 * 필드는 generated-snippets가 아직 생성돼 있지 않아(REST Docs 산출물 미빌드),
 * back/src/test/java/.../adapter/docs/webapi/chat/ChatApiDocsTest.java의
 * chatMessagesResponseFields()/getChatMessages() 실측(RestDocs FieldDescriptor 원본 — 스니펫과
 * 동일한 사실 원천)을 그대로 따른다(재서술 금지). Spring Page가 아닌 커스텀 cursor 페이징 구조다.
 */
export interface ChatMessage {
  id: number
  senderId: number
  /** 클라이언트가 발급한 메시지 UUID. T2.3/T2.4(실시간 수신·낙관 발신 dedup)가 실제로 소비한다. */
  clientMessageId: string
  senderName: string
  content: string
  /** 'yyyy-MM-dd\'T\'HH:mm:ss' 포맷 문자열. dayjs 파싱/표기는 소비 화면에서 처리한다. */
  sentAt: string
  /**
   * 발신자 프로필 이미지 미리보기 URL(예: `/api/employees/1/files/7/preview`). RestDocs상
   * optional(null 가능) — 프로필 사진 미등록 발신자는 null. ChatRoomDetail.members[].profileImageUrl과
   * 동일하게 인증 필요 경로라 BlobAvatar(blob fetch)로만 렌더한다(lib/parseEmpFilePreviewFileId 재사용).
   */
  profileImageUrl: string | null
}

export interface ChatMessagesPage {
  messages: ChatMessage[]
  /** 다음 페이지 요청에 사용할 cursor. RestDocs상 optional(null 가능) — 더 이상 과거 페이지가 없으면 null. */
  nextCursor: number | null
  hasNext: boolean
}
