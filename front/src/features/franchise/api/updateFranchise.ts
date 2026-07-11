import { apiClient } from '@/shared/api/client'

/**
 * 가맹점 기본정보 수정 요청 payload(`FRANCHISE_UPDATE`, request-fields.adoc 실측 기준(추측 금지)).
 * 전 필드 optional — 변경할 필드만 담아 전송한다. ⚠️ 요청 키는 `franchiseName`으로 조회 응답의
 * `name`과 다르다(계약 그대로 — 임의 통일 금지, FranchiseCreateRequest와 동일 주의점).
 */
export interface FranchiseUpdatePayload {
  businessNumber?: string
  franchiseName?: string
  address?: string
  ownerName?: string
  contactNumber?: string
  contactEmail?: string
}

/**
 * 가맹점 기본정보 수정(`FRANCHISE_UPDATE`, api-endpoint.md 기능ID `FRANCHISE_UPDATE` →
 * `PATCH /api/franchises/{franchiseId}`, minRole FRANCHISE 또는 ADMIN). 성공 시 `204 No Content`
 * (http-response.adoc 실측). "최소 1개 변경값 필요"(도메인모델)는 서버 판정이므로 프론트는 사전
 * 차단 없이 그대로 전송하고, 실패 시 던져 호출부가 handleApiError로 위임하도록 둔다
 * (updateMeetingRoom 동형).
 */
export async function updateFranchise(franchiseId: number, payload: FranchiseUpdatePayload): Promise<void> {
  await apiClient.patch(`/api/franchises/${franchiseId}`, payload)
}
