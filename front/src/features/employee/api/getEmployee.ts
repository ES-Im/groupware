import { apiClient } from '@/shared/api/client'
import type { EmployeeInfoResponse } from '../model/me'

export async function getEmployee(empId: number): Promise<EmployeeInfoResponse> {
  const { data } = await apiClient.get<EmployeeInfoResponse>(`/api/employees/${empId}`)
  return data
}
