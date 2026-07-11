import { apiClient } from '@/shared/api/client'
import type { BusinessStatusCode } from '../model/franchise'

/**
 * 가맹점 영업상태 변경(`FRANCHISE_STATUS_UPDATE`, api-endpoint.md 기능ID `FRANCHISE_STATUS_UPDATE` →
 * `PATCH /api/franchises/{franchiseId}/status?status={value}`, minRole FRANCHISE 또는 ADMIN).
 * status는 필수 쿼리 파라미터이며 값은 BusinessStatus **enum 코드**다(query-parameters.adoc 실측) —
 * 조회 응답의 한글 표시명과 혼용 금지(계약 실측 메모). 성공 시 `204 No Content`.
 * 실패 시 던져 호출부가 handleApiError로 위임하도록 둔다.
 */
export async function updateFranchiseStatus(
  franchiseId: number,
  status: BusinessStatusCode,
): Promise<void> {
  await apiClient.patch(`/api/franchises/${franchiseId}/status`, null, { params: { status } })
}
