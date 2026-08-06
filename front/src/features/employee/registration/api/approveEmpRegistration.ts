import { apiClient } from '@/shared/api/client'

export async function approveEmpRegistration(empId: number, hiredAt: string): Promise<void> {
  await apiClient.patch(`/api/employees/${empId}/registration-approval`, null, { params: { hiredAt } })
}
