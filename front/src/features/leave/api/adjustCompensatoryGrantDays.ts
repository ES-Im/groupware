import { apiClient } from '@/shared/api/client'

export async function adjustCompensatoryGrantDays(empId: number, plusMinusDays: number): Promise<void> {
  await apiClient.patch(`/api/employees/${empId}/leaves/compensatory-grant-days`, null, {
    params: { plusMinusDays },
  })
}
