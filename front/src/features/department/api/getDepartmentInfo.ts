import { apiClient } from '@/shared/api/client'
import { normalizeDeptLeader } from '../lib/normalizeDeptLeader'
import type { DeptLeader, DeptInfoResponse, DepartmentDetailResponse } from '../model/deptInfo'

export interface DepartmentDetail {
  deptInfoResponse: DeptInfoResponse
  deptLeader: DeptLeader | null
}

export async function getDepartmentInfo(deptId: number): Promise<DepartmentDetail> {
  const { data } = await apiClient.get<DepartmentDetailResponse>(`/api/departments/${deptId}`)
  return { ...data, deptLeader: normalizeDeptLeader(data.deptLeader) }
}
