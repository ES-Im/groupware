import { apiClient } from '@/shared/api/client'
import type { ApproverParam } from '../model/approverParam'

/**
 * 매출 기안 수정 요청 body(F761 `SALES_DRAFT_UPDATE`, request-fields.adoc 실측).
 *
 * ⚠️ **혼합 구조(평탄화 금지)**: title/content/approvers는 `param` 객체 안에 중첩되고, 매출 전용
 * 필드(franchiseId/reportMonth/salesAmount)는 최상위 형제로 나란히 붙는다(`createSalesDraft`·
 * `updateBusinessTripDraft` 동형). 전부 optional(부분 수정)이나, 수정 폼은 `BusinessTripDraftEditForm`
 * 관례와 동일하게 폼 전체 값을 보내는 전량 갱신으로 단순화한다(부분 전송도 계약상 허용).
 */
export interface SalesDraftUpdatePayload {
  param?: {
    title?: string
    content?: string
    approvers?: ApproverParam[]
  }
  /** 수정할 대상 가맹점 식별 번호(서버는 존재 여부만 검증, 담당 여부 미검증). */
  franchiseId?: number
  /** 수정할 매출 보고 월, `yyyy-MM`. */
  reportMonth?: string
  /** 수정할 매출액(양의 정수, 백엔드 `salesAmount>0` 강제). */
  salesAmount?: number
}

/**
 * 매출 기안 수정(F761, 기안자 본인 + 대상 UNSUBMITTED). `PATCH /api/drafts/sales/{draftId}`,
 * 응답 `204` Empty(본문 없음). 실패(권한/상태 위반 — 타인·이미 상신됨)는 에러를 그대로 던져
 * 호출부의 submitWithErrorMapping이 handleApiError로 위임하도록 둔다.
 */
export async function updateSalesDraft(
  draftId: number,
  payload: SalesDraftUpdatePayload,
): Promise<void> {
  await apiClient.patch(`/api/drafts/sales/${draftId}`, payload)
}
