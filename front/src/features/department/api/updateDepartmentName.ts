import { apiClient } from '@/shared/api/client'

export async function updateDepartmentName(deptId: number, newName: string): Promise<void> {
  await apiClient.patch(`/api/departments/${deptId}/name`, null, { params: { newName } })
}
