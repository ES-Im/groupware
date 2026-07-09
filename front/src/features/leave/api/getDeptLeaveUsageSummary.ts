import { apiClient } from '@/shared/api/client'
import type { DeptLeaveUsageSummaryParams } from '../model/deptLeave'
import type { LeaveUsageSummary } from '../model/leave'

/**
 * 부서 연차 사용률 조회(`DEPT_EMP_LEAVE_USAGE_SUMMARY`, F746 →
 * `GET /api/departments/{deptId}/employees/leaves/usage-summary`, DEPT_MANAGER(같은 부서) 또는 ADMIN).
 *
 * 응답(`LeaveUsageSummary`)은 `EMP_LEAVE_USAGE_SUMMARY`(M5)와 완전히 동형이라 `model/leave.ts`의
 * 기존 타입을 그대로 재사용한다. year 쿼리 파라미터는 선택값이며 미입력 시 서버가 현재 연도를
 * 기본값으로 적용한다. 응답은 단일 객체다(Page 아님).
 *
 * 타 부서 접근 시 서버가 403(ROLE_003)을 반환하며, 이 함수는 별도 처리 없이 그대로 throw한다.
 */
export async function getDeptLeaveUsageSummary(
  deptId: number,
  params?: DeptLeaveUsageSummaryParams,
): Promise<LeaveUsageSummary> {
  const query: Record<string, number> = {}
  if (params?.year != null) {
    query.year = params.year
  }
  const { data } = await apiClient.get<LeaveUsageSummary>(
    `/api/departments/${deptId}/employees/leaves/usage-summary`,
    { params: query },
  )
  return data
}
