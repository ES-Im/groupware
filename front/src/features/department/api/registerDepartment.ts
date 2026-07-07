import { apiClient } from '@/shared/api/client'
import type { RegisterDepartmentFormValues } from '../model/registerDepartmentSchema'

/**
 * 부서 등록(`DEPT_REGISTER`, api-endpoint.md `POST /api/departments`, ADMIN 전용).
 * 필드 근거: back/build/generated-snippets/DEPT_REGISTER/request-fields.adoc.
 * 성공 시 `204 No Content`(응답 본문 없음) — 호출부가 departmentKeys.all을 invalidate해 재조회한다.
 */
export async function registerDepartment(values: RegisterDepartmentFormValues): Promise<void> {
  await apiClient.post('/api/departments', values)
}
