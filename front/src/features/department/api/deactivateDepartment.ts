import { apiClient } from '@/shared/api/client'

export async function deactivateDepartment(deptId: number): Promise<void> {
  await apiClient.patch(`/api/departments/${deptId}/deactivation`)
}
