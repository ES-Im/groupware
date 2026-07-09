import { apiClient } from '@/shared/api/client'
import type { ApproverParam } from '../model/approverParam'

/**
 * 휴가 기안 수정 요청 body(F741 `LEAVE_DRAFT_UPDATE`, request-fields.adoc 실측).
 *
 * ⚠️ **혼합 구조(평탄화 금지)**: title/content/approvers는 `param` 객체 안에 중첩되고, 휴가 전용
 * 필드(startAt/endAt/leaveType)는 최상위 형제로 나란히 붙는다(`updateBusinessTripDraft` 동형 —
 * 필드만 다름). 전부 optional(부분 수정)이나, 수정 폼은 `BusinessTripDraftEditForm` 관례와 동일하게
 * 폼 전체 값을 보내는 전량 갱신으로 단순화한다(부분 전송도 계약상 허용).
 */
export interface LeaveDraftUpdatePayload {
  param?: {
    title?: string
    content?: string
    approvers?: ApproverParam[]
  }
  /** 수정할 휴가 시작 일시, `yyyy-MM-dd'T'HH:mm:ss`(초 보정은 호출부 책임). */
  startAt?: string
  /** 수정할 휴가 종료 일시, `yyyy-MM-dd'T'HH:mm:ss`(초 보정은 호출부 책임). */
  endAt?: string
  /** 수정할 휴가 유형(enum 코드, `leaveTypeLabels`의 key). */
  leaveType?: string
}

/**
 * 휴가 기안 수정(F741, 기안자 본인 + 대상 UNSUBMITTED). `PATCH /api/drafts/leaves/{draftId}`,
 * 응답 `204` Empty(본문 없음). 실패(권한/상태 위반 — 타인·이미 상신됨)는 에러를 그대로 던져
 * 호출부의 submitWithErrorMapping이 handleApiError로 위임하도록 둔다.
 */
export async function updateLeaveDraft(
  draftId: number,
  payload: LeaveDraftUpdatePayload,
): Promise<void> {
  await apiClient.patch(`/api/drafts/leaves/${draftId}`, payload)
}
