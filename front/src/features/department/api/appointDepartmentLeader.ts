import { apiClient } from '@/shared/api/client'

export async function appointDepartmentLeader(
  deptId: number,
  params: { leaderEmpId: number; appointedAt: string },
): Promise<void> {
  await apiClient.patch(`/api/departments/${deptId}/leader/appointment`, null, { params })
}
