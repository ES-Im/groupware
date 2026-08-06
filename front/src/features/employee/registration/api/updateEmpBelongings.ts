import { apiClient } from '@/shared/api/client'
import type { EmpBelongingsRawPayload } from '../../model/empBelongingsPayload'

export async function updateEmpBelongings(
  empId: number,
  payload: EmpBelongingsRawPayload,
): Promise<void> {
  await apiClient.patch(`/api/employees/${empId}/belongings`, payload)
}
