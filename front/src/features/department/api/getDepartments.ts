import { apiClient } from '@/shared/api/client'
import { normalizeDeptLeader } from '../lib/normalizeDeptLeader'
import type { DeptInfoResponse, DeptLeader } from '../model/deptInfo'
import type { Page } from '../model/deptMember'
import type { DeptsPage } from '../model/deptSummary'

export interface DepartmentSummary {
  deptInfoResponse: DeptInfoResponse
  deptLeader: DeptLeader | null
}

export type DepartmentsPage = Page<DepartmentSummary>

export async function getDepartments(params?: {
  keyword?: string
  isActive?: boolean
  page?: number
  size?: number
}): Promise<DepartmentsPage> {
  const query: Record<string, string | number | boolean> = {}
  if (params?.keyword) {
    query.keyword = params.keyword
  }
  if (params?.isActive != null) {
    query.isActive = params.isActive
  }
  if (params?.page != null) {
    query.page = params.page
  }
  if (params?.size != null) {
    query.size = params.size
  }
  const { data } = await apiClient.get<DeptsPage>('/api/departments', { params: query })
  return {
    ...data,
    content: data.content.map((item) => ({
      ...item,
      deptLeader: normalizeDeptLeader(item.deptLeader),
    })),
  }
}
