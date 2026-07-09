import { apiClient } from '@/shared/api/client'

/**
 * 공람자 추가(`DRAFT_CIRCULATION_ADD`, F707 → `POST /api/drafts/{draftId}/circulations`, minRole EMPLOYEE).
 *
 * request-fields.adoc 실측: body `{ empIds: number[] }`(필수·빈 배열 불가). 성공 시 `204 No Content`.
 * 기안자 본인만 배치 추가할 수 있으며(서버 최종 판정), 추가 직후 각 공람자는 미열람(readAt=null)이다.
 * 빈 배열·기안자 아님 등은 도메인 에러로 내려온다(호출부 mutation이 apiError로 처리).
 */
export async function addCirculation(draftId: number, empIds: number[]): Promise<void> {
  await apiClient.post(`/api/drafts/${draftId}/circulations`, { empIds })
}
