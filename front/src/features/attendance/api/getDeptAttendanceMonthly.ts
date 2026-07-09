import { apiClient } from '@/shared/api/client'
import type { AttendanceStatus } from '../model/attendance'
import type { DeptAttendanceMonthly } from '../model/deptAttendance'

/**
 * 부서 월별 근태 목록 조회(`DEPT_ATTENDANCE_MONTHLY`, api-endpoint.md 기능ID `DEPT_ATTENDANCE_MONTHLY` →
 * `GET /api/employees/attendances/{deptId}/monthly`, minRole DEPT_MANAGER).
 *
 * yearMonth/keyword/status/page/size 쿼리 파라미터는 전부 선택값이다(query-parameters.adoc 실측).
 * yearMonth 미입력 시 서버가 현재 월을 기본값으로 적용한다. 값이 없는 파라미터는 쿼리스트링
 * 자체에서 생략되도록 params 객체에 조건부로만 채운다(getMyAttendanceMonthly와 동일 패턴).
 *
 * 타 부서 접근 시 서버가 403(ROLE_003)을 반환하며, 이 함수는 별도 처리 없이 그대로 throw한다
 * (호출부가 기존 handleApiError로 정규화 소비, 재구현 금지).
 *
 * 응답은 Spring Data Page 표준 구조(DeptAttendanceMonthly = Page<DeptAttendanceRow>) 그대로 반환한다.
 */
export async function getDeptAttendanceMonthly(
  deptId: number,
  params?: {
    yearMonth?: string
    keyword?: string
    status?: AttendanceStatus
    page?: number
    size?: number
  },
): Promise<DeptAttendanceMonthly> {
  const query: Record<string, string | number> = {}
  if (params?.yearMonth) {
    query.yearMonth = params.yearMonth
  }
  if (params?.keyword) {
    query.keyword = params.keyword
  }
  if (params?.status) {
    query.status = params.status
  }
  if (params?.page != null) {
    query.page = params.page
  }
  if (params?.size != null) {
    query.size = params.size
  }
  const { data } = await apiClient.get<DeptAttendanceMonthly>(
    `/api/employees/attendances/${deptId}/monthly`,
    { params: query },
  )
  return data
}
