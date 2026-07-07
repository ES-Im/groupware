import { apiClient } from '@/shared/api/client'
import { normalizeDeptLeader } from '../lib/normalizeDeptLeader'
import type { DeptLeader, DeptInfoResponse, DepartmentDetailResponse } from '../model/deptInfo'

/** 화면이 소비하는 부서 상세 응답. deptLeader는 정규화를 거쳐 공석이면 null로 좁혀진 상태다. */
export interface DepartmentDetail {
  deptInfoResponse: DeptInfoResponse
  deptLeader: DeptLeader | null
}

/**
 * 부서 상세 조회(`DEPT_INFO`, api-endpoint.md 기능ID `DEPT_INFO` →
 * `GET /api/departments/{deptId}`, minRole EMPLOYEE).
 *
 * deptInfoResponse(부서 기본 정보)와 deptLeader(부서장, 공석이면 null)를 함께 반환한다.
 * wire상 deptLeader는 부서장 공석 시 null이 아니라 전 필드 null 객체(`DeptLeaderWire`)로
 * 내려오므로(3.department-management-prd.md "부서장 공석 wire 계약" 절), `normalizeDeptLeader`로
 * 정규화해 상위 컴포넌트가 "deptLeader === null"이라는 깔끔한 계약만 신뢰하도록 한다.
 */
export async function getDepartmentInfo(deptId: number): Promise<DepartmentDetail> {
  const { data } = await apiClient.get<DepartmentDetailResponse>(`/api/departments/${deptId}`)
  return { ...data, deptLeader: normalizeDeptLeader(data.deptLeader) }
}
