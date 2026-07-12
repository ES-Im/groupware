import { apiClient } from '@/shared/api/client'
import type { EmpBelongingsCreatePayload } from '../model/empBelongingsCreatePayload'

/**
 * 사원 소속 정보 등록/수정(`HR_UPDATE_EMP_BELONGINGS`, api-endpoint.md 기능ID
 * `HR_UPDATE_EMP_BELONGINGS` → `PATCH /api/employees/{empId}/belongings`).
 * 성공 시 `204 No Content`.
 */
export async function updateEmpBelongings(
  empId: number,
  payload: EmpBelongingsCreatePayload,
): Promise<void> {
  await apiClient.patch(`/api/employees/${empId}/belongings`, payload)
}
