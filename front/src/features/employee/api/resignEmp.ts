import { apiClient } from '@/shared/api/client'

export async function resignEmp(empId: number, resignAt: string): Promise<void> {
  await apiClient.patch(`/api/employees/${empId}/resignation`, undefined, {
    params: { hiredAt: resignAt },
  })
}
