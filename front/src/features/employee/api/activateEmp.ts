import { apiClient } from '@/shared/api/client'

export async function activateEmp(empId: number): Promise<void> {
  await apiClient.patch(`/api/employees/${empId}/status/activation`)
}
