import { apiClient } from '@/shared/api/client'
import type { EmpManagementListParams, EmpManagementPage } from '../model/empManagement'

export async function getEmpsForManagement(
  params?: EmpManagementListParams,
): Promise<EmpManagementPage> {
  const query: Record<string, string | number> = {}
  if (params?.deptId != null) {
    query.deptId = params.deptId
  }
  if (params?.status) {
    query.status = params.status
  }
  if (params?.keyword) {
    query.keyword = params.keyword
  }
  if (params?.page != null) {
    query.page = params.page
  }
  if (params?.size != null) {
    query.size = params.size
  }
  const { data } = await apiClient.get<EmpManagementPage>('/api/employees', { params: query })
  return data
}
