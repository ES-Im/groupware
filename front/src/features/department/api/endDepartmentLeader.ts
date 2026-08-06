import { apiClient } from '@/shared/api/client'

export async function endDepartmentLeader(params: {
  deptId: number
  endAt: string
}): Promise<void> {
  const { deptId, endAt } = params
  await apiClient.patch(`/api/departments/${deptId}/leader/end`, null, {
    params: { endAt },
  })
}
