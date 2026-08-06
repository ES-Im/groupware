import { apiClient } from '@/shared/api/client'
import type { DeptMembersPage } from '../model/deptMember'

export async function getDepartmentMembers(
  deptId: number,
  params?: { keyword?: string; page?: number; size?: number },
): Promise<DeptMembersPage> {
  const query: Record<string, string | number> = {}
  if (params?.keyword) {
    query.keyword = params.keyword
  }
  if (params?.page != null) {
    query.page = params.page
  }
  if (params?.size != null) {
    query.size = params.size
  }
  const { data } = await apiClient.get<DeptMembersPage>(`/api/departments/${deptId}/members`, {
    params: query,
  })
  return data
}
