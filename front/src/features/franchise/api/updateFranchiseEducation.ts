import { apiClient } from '@/shared/api/client'

/**
 * 교육 수정 요청 payload(`FRANCHISE_EDUCATION_UPDATE`, request-fields.adoc 실측 기준(추측 금지)).
 * 전 필드 optional — 변경할 필드만 담아 전송한다. educationDate는 `yyyy-MM-dd'T'HH:mm:ss`
 * 문자열(조회 응답은 date/startAt 둘로 쪼개 내려오지만 수정 요청은 하나로 합친다 —
 * FranchiseEducationCreateRequest와 동일 주의점, 키 이름·형식 임의 통일 금지).
 */
export interface FranchiseEducationUpdatePayload {
  educationDate?: string
  place?: string
  title?: string
  content?: string
  capacity?: number
}

/**
 * 교육 수정(`FRANCHISE_EDUCATION_UPDATE`, api-endpoint.md 기능ID `FRANCHISE_EDUCATION_UPDATE` →
 * `PATCH /api/franchise-educations/{educationId}`, minRole FRANCHISE 또는 ADMIN).
 * 성공 시 `204 No Content`(http-response.adoc 실측). 등록자 본인/비활성/신청자 0명 조건은
 * 서버 판정이다 — 위반 시 던져 호출부가 handleApiError로 위임하도록 둔다(updateFranchise 동형).
 */
export async function updateFranchiseEducation(
  educationId: number,
  payload: FranchiseEducationUpdatePayload,
): Promise<void> {
  await apiClient.patch(`/api/franchise-educations/${educationId}`, payload)
}
