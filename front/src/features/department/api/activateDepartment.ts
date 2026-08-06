import { apiClient } from '@/shared/api/client'

export async function activateDepartment(deptId: number): Promise<void> {
  await apiClient.patch(`/api/departments/${deptId}/activation`)
}
