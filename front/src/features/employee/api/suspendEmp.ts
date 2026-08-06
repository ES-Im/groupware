import { apiClient } from '@/shared/api/client'

export async function suspendEmp(empId: number): Promise<void> {
  await apiClient.patch(`/api/employees/${empId}/status/suspension`)
}
