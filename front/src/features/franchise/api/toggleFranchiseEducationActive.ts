import { apiClient } from '@/shared/api/client'

/**
 * 교육 활성화(`FRANCHISE_EDUCATION_ACTIVATE`, api-endpoint.md 기능ID `FRANCHISE_EDUCATION_ACTIVATE`
 * → `POST /api/franchise-educations/{educationId}/activation`, minRole FRANCHISE 또는 ADMIN).
 * 요청 본문 없음, 성공 시 `204 No Content`(http-request/response.adoc 실측).
 * ⚠️ HTTP 메서드가 **POST**다 — 회의실 토글 선례(toggleMeetingRoomActive, PATCH)와 다르므로
 * 임의 통일 금지(스니펫 실측 그대로).
 */
export async function activateFranchiseEducation(educationId: number): Promise<void> {
  await apiClient.post(`/api/franchise-educations/${educationId}/activation`)
}

/**
 * 교육 비활성화(`FRANCHISE_EDUCATION_DEACTIVATE`, api-endpoint.md 기능ID
 * `FRANCHISE_EDUCATION_DEACTIVATE` → `POST /api/franchise-educations/{educationId}/deactivation`,
 * minRole FRANCHISE 또는 ADMIN). 요청 본문 없음, 성공 시 `204 No Content`. 메서드는 POST(위와 동일).
 */
export async function deactivateFranchiseEducation(educationId: number): Promise<void> {
  await apiClient.post(`/api/franchise-educations/${educationId}/deactivation`)
}
