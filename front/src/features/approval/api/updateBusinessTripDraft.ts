import { apiClient } from '@/shared/api/client'
import type { ApproverParam } from '../model/approverParam'

/**
 * 출장 기안 수정 요청 body(F731 `BUSINESS_TRIP_DRAFT_UPDATE`, request-fields.adoc 실측).
 *
 * ⚠️ **혼합 구조(평탄화 금지)**: title/content/approvers는 `param` 객체 안에 중첩되고, 출장 전용
 * 필드(startAt/endAt/destination/purpose)는 최상위 형제로 나란히 붙는다(`createBusinessTripDraft`
 * 동형). **participantIds 없음** — 참여자 교체는 별도 엔드포인트(F732, `updateBusinessTripParticipants`).
 * 전부 optional(부분 수정)이나, 수정 폼은 `GeneralDraftEditForm` 관례와 동일하게 폼 전체 값을 보내는
 * 전량 갱신으로 단순화한다(부분 전송도 계약상 허용).
 */
export interface BusinessTripDraftUpdatePayload {
  param?: {
    title?: string
    content?: string
    approvers?: ApproverParam[]
  }
  /** 수정할 출장 시작 일시, `yyyy-MM-dd'T'HH:mm:ss`(초 보정은 호출부 책임). */
  startAt?: string
  /** 수정할 출장 종료 일시, `yyyy-MM-dd'T'HH:mm:ss`(초 보정은 호출부 책임). */
  endAt?: string
  destination?: string
  purpose?: string
}

/**
 * 출장 기안 수정(F731, 기안자 본인 + 대상 UNSUBMITTED). `PATCH /api/drafts/business-trips/{draftId}`,
 * 응답 `204` Empty(본문 없음). 실패(권한/상태 위반 — 타인·이미 상신됨)는 에러를 그대로 던져
 * 호출부의 submitWithErrorMapping이 handleApiError로 위임하도록 둔다.
 */
export async function updateBusinessTripDraft(
  draftId: number,
  payload: BusinessTripDraftUpdatePayload,
): Promise<void> {
  await apiClient.patch(`/api/drafts/business-trips/${draftId}`, payload)
}
