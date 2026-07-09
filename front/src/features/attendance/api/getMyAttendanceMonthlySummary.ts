import { apiClient } from '@/shared/api/client'
import type { MyAttendanceSummary } from '../model/attendance'

/**
 * 내 월별 근태 요약 조회(`MY_ATTENDANCE_MONTHLY_SUMMARY`, api-endpoint.md 기능ID
 * `MY_ATTENDANCE_MONTHLY_SUMMARY` → `GET /api/employees/attendances/me/monthly/summary`,
 * minRole EMPLOYEE).
 *
 * yearMonth 쿼리 파라미터는 선택값이다(query-parameters.adoc 실측). 미입력 시 서버가 현재 월을
 * 기본값으로 적용한다. 값이 없으면 쿼리스트링 자체에서 생략되도록 params 객체에 조건부로만 채운다.
 *
 * 응답은 배열이 아닌 단일 객체(MyAttendanceSummary)다(response-fields.adoc 실측 — content 래핑 없음).
 */
export async function getMyAttendanceMonthlySummary(params?: {
  yearMonth?: string
}): Promise<MyAttendanceSummary> {
  const query: Record<string, string> = {}
  if (params?.yearMonth) {
    query.yearMonth = params.yearMonth
  }
  const { data } = await apiClient.get<MyAttendanceSummary>(
    '/api/employees/attendances/me/monthly/summary',
    { params: query },
  )
  return data
}
