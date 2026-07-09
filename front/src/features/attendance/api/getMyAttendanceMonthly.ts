import { apiClient } from '@/shared/api/client'
import type { AttendanceStatus, MyAttendance } from '../model/attendance'

/**
 * 내 월별 근태 목록 조회(`MY_ATTENDANCE_MONTHLY`, api-endpoint.md 기능ID `MY_ATTENDANCE_MONTHLY` →
 * `GET /api/employees/attendances/me/monthly`, minRole EMPLOYEE).
 *
 * yearMonth/status/page/size 쿼리 파라미터는 전부 선택값이다(query-parameters.adoc 실측).
 * yearMonth 미입력 시 서버가 현재 월을 기본값으로 적용한다. 값이 없는 파라미터는 쿼리스트링
 * 자체에서 생략되도록 params 객체에 조건부로만 채운다(board getBoardList/department
 * getDepartments와 동일 패턴).
 *
 * 응답은 Spring Data Page 표준 구조(MyAttendance = Page<AttendanceItem>) 그대로 반환한다.
 * number(현재 페이지, 0-based)는 파싱 단계에서 변환하지 않고 UI 소비 시점에 +1한다
 * (docs/backend-contract/page.md 컨벤션).
 */
export async function getMyAttendanceMonthly(params?: {
  yearMonth?: string
  status?: AttendanceStatus
  page?: number
  size?: number
}): Promise<MyAttendance> {
  const query: Record<string, string | number> = {}
  if (params?.yearMonth) {
    query.yearMonth = params.yearMonth
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
  const { data } = await apiClient.get<MyAttendance>('/api/employees/attendances/me/monthly', {
    params: query,
  })
  return data
}
