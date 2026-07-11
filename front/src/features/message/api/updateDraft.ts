import { apiClient } from '@/shared/api/client'

/**
 * 임시 쪽지 제목/본문 수정 요청 body(F1516 `MESSAGE_DRAFT_UPDATE`, request-fields.adoc 실측:
 * title/content 둘 다 optional·공백 불가, title 50자 이하). 편집 뷰(T5.1)는 두 필드 모두 필수
 * 입력으로 다루므로 저장 시 폼 전체 값을 그대로 보내는 전량 갱신으로 단순화한다(부분 전송도
 * 계약상 허용, approval updateGeneralDraft 동일 판단).
 */
export interface UpdateDraftPayload {
  title?: string
  content?: string
}

/**
 * 임시 쪽지 제목/본문 수정(`MESSAGE_DRAFT_UPDATE`, F1516, `PATCH /api/messages/drafts/{messageId}`,
 * 작성자 본인). 성공 시 `204 No Content`(응답 본문 없음). 실패(권한/상태 위반 등)는 에러를 그대로
 * 던져 호출부가 handleApiError로 위임하도록 둔다(updateGeneralDraft 동형).
 */
export async function updateDraft(messageId: number, payload: UpdateDraftPayload): Promise<void> {
  await apiClient.patch(`/api/messages/drafts/${messageId}`, payload)
}
