import { apiClient } from '@/shared/api/client'
import type { DeptAttendancePending } from '../model/deptAttendance'

/**
 * 부서 승인 대기 근태 목록 조회(`DEPT_ATTENDANCE_PENDING`, api-endpoint.md 기능ID
 * `DEPT_ATTENDANCE_PENDING` → `GET /api/employees/attendances/{deptId}/monthly/pending`,
 * minRole DEPT_MANAGER).
 *
 * query-parameters.adoc 실측대로 page/size만 존재하고 필터(keyword/status 등)는 없다.
 * 값이 없는 파라미터는 쿼리스트링 자체에서 생략되도록 params 객체에 조건부로만 채운다.
 *
 * 타 부서 접근 시 서버가 403(ROLE_003)을 반환하며, 이 함수는 별도 처리 없이 그대로 throw한다
 * (호출부가 기존 handleApiError로 정규화 소비, 재구현 금지).
 *
 * 응답은 Spring Data Page 표준 구조(DeptAttendancePending = Page<DeptPendingRow>) 그대로 반환한다.
 */
export async function getDeptAttendancePending(
  deptId: number,
  params?: {
    page?: number
    size?: number
  },
): Promise<DeptAttendancePending> {
  const query: Record<string, number> = {}
  if (params?.page != null) {
    query.page = params.page
  }
  if (params?.size != null) {
    query.size = params.size
  }
  const { data } = await apiClient.get<DeptAttendancePending>(
    `/api/employees/attendances/${deptId}/monthly/pending`,
    { params: query },
  )
  return data
}
