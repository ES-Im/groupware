import { apiClient } from '@/shared/api/client'
import type { EmployeeInfoResponse } from '../model/me'

/**
 * 타 사원 단건 정보 조회(`RETRIEVE_EMP_INFO`, api-endpoint.md EMP_ACCOUNT API 섹션).
 * 응답 스키마는 RETRIEVE_ME_INFO와 완전히 동일함을 스니펫 실측으로 확인했다(ROADMAP T2.2)
 * — EmployeeInfoResponse(model/me.ts)를 공유해 EmployeeInfoView로 함께 렌더한다.
 */
export async function getEmployee(empId: number): Promise<EmployeeInfoResponse> {
  const { data } = await apiClient.get<EmployeeInfoResponse>(`/api/employees/${empId}`)
  return data
}
