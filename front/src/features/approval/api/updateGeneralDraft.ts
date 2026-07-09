import { apiClient } from '@/shared/api/client'
import type { ApproverParam } from '../model/approverParam'

/**
 * 일반 기안 수정 요청 body(F721 `GENERAL_DRAFT_UPDATE`, request-fields.adoc 실측).
 * 세 필드 모두 optional(부분 수정)이나, 수정 폼은 title/content를 필수 입력으로 다루고 폼 전체 값을
 * 보내는 전량 갱신으로 단순화한다(부분 전송도 계약상 허용). approvers는 취소기안/작성과 동일하게
 * 객체 안 `approvers` 필드로 감싼 결재선 배열이다.
 */
export interface GeneralDraftUpdatePayload {
  title?: string
  content?: string
  approvers?: ApproverParam[]
}

/**
 * 일반 기안 수정(F721, 기안자 본인 + 대상 UNSUBMITTED). `PATCH /api/drafts/generals/{draftId}`,
 * 응답 `204` Empty(본문 없음). 실패(권한/상태 위반 — 타인·이미 상신됨)는 에러를 그대로 던져
 * 호출부의 submitWithErrorMapping이 handleApiError로 위임하도록 둔다.
 */
export async function updateGeneralDraft(
  draftId: number,
  payload: GeneralDraftUpdatePayload,
): Promise<void> {
  await apiClient.patch(`/api/drafts/generals/${draftId}`, payload)
}
