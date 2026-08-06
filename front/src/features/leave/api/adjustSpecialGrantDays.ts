import { apiClient } from '@/shared/api/client'

export async function adjustSpecialGrantDays(empId: number, plusMinusDays: number): Promise<void> {
  await apiClient.patch(`/api/employees/${empId}/leaves/special-grant-days`, null, {
    params: { plusMinusDays },
  })
}
