import { apiClient } from '@/shared/api/client'

/**
 * 임시 쪽지 수신자 변경(`MESSAGE_DRAFT_RECEIVERS_UPDATE`, F1517,
 * `PATCH /api/messages/drafts/{messageId}/receivers`, 작성자 본인). `receiverIds`는 필수(빈 배열·
 * null 요소 불가, request-fields.adoc 실측) — 편집 뷰(T5.1)는 EmployeePicker 선택값을 그대로
 * 보내므로 빈 선택 자체를 막는 클라 가드는 호출부(MessageComposeView)가 담당한다. 성공 시
 * `204 No Content`(응답 본문 없음). 실패는 에러를 그대로 던져 호출부가 handleApiError로 위임하도록
 * 둔다.
 */
export async function updateDraftReceivers(
  messageId: number,
  receiverIds: number[],
): Promise<void> {
  await apiClient.patch(`/api/messages/drafts/${messageId}/receivers`, { receiverIds })
}
