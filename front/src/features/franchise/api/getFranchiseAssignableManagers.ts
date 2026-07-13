import { apiClient } from '@/shared/api/client'
import type { AssignableManager } from '../model/franchise'

/**
 * 가맹점 담당자/답변 담당 배정 후보(FRANCHISE 권한 사원) 조회
 * (`FRANCHISE_ASSIGNABLE_MANAGERS`, api-endpoint.md → `GET /api/franchises/assignable-managers`,
 * minRole FRANCHISE 또는 ADMIN). 응답 루트는 배열이다(response-fields.adoc 실측).
 *
 * 서버가 ACTIVE + FRANCHISE 권한 사원만 반환하므로 클라이언트 추가 필터는 없다 — 배정 picker는
 * 이 목록을 그대로 후보로 노출한다(배정 command도 서버가 동일 규약을 재검증).
 */
export async function getFranchiseAssignableManagers(): Promise<AssignableManager[]> {
  const { data } = await apiClient.get<AssignableManager[]>('/api/franchises/assignable-managers')
  return data
}
