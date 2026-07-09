import { apiClient } from '@/shared/api/client'
import type { LeaveUsageSummary } from '../model/leave'

/**
 * 관리자 회사/부서 연차 사용률 조회(`EMP_LEAVE_USAGE_SUMMARY`, F748, ROADMAP(LEAVE) M5 T5.1 →
 * `GET /api/employees/leaves/usage-summary`, ADMIN 전용).
 *
 * 단일 객체 응답(Page 아님). deptId/year 쿼리 파라미터는 둘 다 선택값이다(query-parameters.adoc
 * 실측). deptId 미지정 시 회사 전체 기준, 지정 시 해당 부서 기준으로 응답한다. year 미입력 시
 * 서버가 현재 연도를 기본값으로 적용한다.
 */
export async function getEmpLeaveUsageSummary(params?: {
  deptId?: number
  year?: number
}): Promise<LeaveUsageSummary> {
  const query: Record<string, number> = {}
  if (params?.deptId != null) {
    query.deptId = params.deptId
  }
  if (params?.year != null) {
    query.year = params.year
  }
  const { data } = await apiClient.get<LeaveUsageSummary>('/api/employees/leaves/usage-summary', {
    params: query,
  })
  return data
}
