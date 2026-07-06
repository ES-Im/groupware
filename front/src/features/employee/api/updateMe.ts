import { apiClient } from '@/shared/api/client'
import type { UpdateMeFormValues } from '../model/updateMeSchema'

/**
 * 본인 개인정보 수정(`UPDATE_SELF_INFO`, api-endpoint.md `PATCH /api/employees/me`).
 * 필드 근거: back/build/generated-snippets/UPDATE_SELF_INFO/request-fields.adoc.
 * 성공 시 `204 No Content`(응답 본문 없음) — 호출부가 employeeKeys.me()를 invalidate해 재조회한다.
 */
export async function updateMe(values: UpdateMeFormValues): Promise<void> {
  await apiClient.patch('/api/employees/me', values)
}
