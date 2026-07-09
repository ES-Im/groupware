import { apiClient } from '@/shared/api/client'
import type { DeptLeaveHistoryParams, DeptLeaveHistoryRow } from '../model/deptLeave'
import type { Page } from '../model/leave'

/**
 * 부서 휴가 신청 이력 조회(`DEPT_LEAVE_REQUEST_HISTORY`, F744 →
 * `GET /api/leaves/departments/{deptId}/request-history`, DEPT_MANAGER(같은 부서) 또는 ADMIN).
 *
 * keyword/approvalStatus/yearMonth/page/size 쿼리 파라미터는 전부 선택값이다(query-parameters.adoc
 * 실측). yearMonth 미입력 시 서버가 현재 월을 기본값으로 적용한다. 값이 없는 파라미터는 쿼리스트링
 * 자체에서 생략되도록 params 객체에 조건부로만 채운다(approval getDeptBusinessTripHistory와 동일 패턴).
 *
 * 타 부서 접근 시 서버가 403(ROLE_003)을 반환하며, 이 함수는 별도 처리 없이 그대로 throw한다
 * (호출부가 handleApiError로 정규화 소비, 재구현 금지).
 */
export async function getDeptLeaveHistory(
  deptId: number,
  params?: DeptLeaveHistoryParams,
): Promise<Page<DeptLeaveHistoryRow>> {
  const query: Record<string, string | number> = {}
  if (params?.keyword) {
    query.keyword = params.keyword
  }
  if (params?.approvalStatus) {
    query.approvalStatus = params.approvalStatus
  }
  if (params?.yearMonth) {
    query.yearMonth = params.yearMonth
  }
  if (params?.page != null) {
    query.page = params.page
  }
  if (params?.size != null) {
    query.size = params.size
  }
  const { data } = await apiClient.get<Page<DeptLeaveHistoryRow>>(
    `/api/leaves/departments/${deptId}/request-history`,
    { params: query },
  )
  return data
}
