import { apiClient } from '@/shared/api/client'
import type { ApproverParam } from '../model/approverParam'

/**
 * 매출 기안 생성/상신 요청 body(F760, request-fields.adoc 실측 — request-body.adoc 예시로 구조 확정).
 *
 * ⚠️ **혼합 구조(평탄화 금지)**: title/content/approvers는 `param` 객체 안에 중첩되고, 매출 전용
 * 필드(franchiseId/reportMonth/salesAmount)는 최상위 형제로 나란히 붙는다(③출장·④연가와 동형,
 * ②일반의 평탄 `{title,content,approvers}`와 다름 — ROADMAP(SALES) §계약 실측 메모).
 */
export interface SalesDraftPayload {
  param: {
    title: string
    content: string
    approvers?: ApproverParam[]
  }
  /** 대상 가맹점 식별 번호(서버는 존재 여부만 검증, 담당 여부 미검증). */
  franchiseId: number
  /** 매출 보고 월, `yyyy-MM`. */
  reportMonth: string
  /** 매출액(양의 정수, 백엔드 `salesAmount>0` 강제). */
  salesAmount: number
}

/** 매출 기안 생성/상신 응답(response-body.adoc 실측: 생성된 기안서 식별 번호). */
export interface SalesDraftResult {
  draftId: number
}

/**
 * 매출 기안 생성 또는 생성+상신(F760, `FRANCHISE` role 사원).
 *   - submit=false → `POST /api/drafts/sales`(생성=임시저장, `SALES_DRAFT_CREATE`)
 *   - submit=true  → `POST /api/drafts/sales/submission`(생성+상신, `SALES_DRAFT_CREATE_SUBMISSION`)
 * 두 엔드포인트는 동일 body/응답 계약을 공유한다(`201`, `{draftId}`, `createBusinessTripDraft` 동형).
 * 실패(권한 부족·매출액 0 이하·상신 결재선 규칙 위반 등)는 에러를 그대로 던져 호출부의
 * submitWithErrorMapping이 handleApiError로 위임하도록 둔다.
 */
export async function createSalesDraft(
  payload: SalesDraftPayload,
  submit: boolean,
): Promise<SalesDraftResult> {
  const url = submit ? '/api/drafts/sales/submission' : '/api/drafts/sales'
  const { data } = await apiClient.post<SalesDraftResult>(url, payload)
  return data
}
