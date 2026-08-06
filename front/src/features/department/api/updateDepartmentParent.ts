import { apiClient } from '@/shared/api/client'

export async function updateDepartmentParent(params: {
  deptId: number
  parentDeptId?: number
}): Promise<void> {
  const { deptId, parentDeptId } = params
  const query: Record<string, number> = {}
  if (parentDeptId != null) {
    query.parentDeptId = parentDeptId
  }
  await apiClient.patch(`/api/departments/${deptId}/parent`, null, { params: query })
}
