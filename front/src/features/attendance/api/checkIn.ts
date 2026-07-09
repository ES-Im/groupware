import { apiClient } from '@/shared/api/client'

/**
 * 출근 체크인(`MY_ATTENDANCE_CHECK_IN`, api-endpoint.md 기능ID `MY_ATTENDANCE_CHECK_IN` →
 * `POST /api/employees/attendances/me/check-in`, minRole EMPLOYEE).
 *
 * 요청 본문 없음(back/build/generated-snippets/MY_ATTENDANCE_CHECK_IN/curl-request.adoc·
 * request-body.adoc 실측). 성공 시 `204 No Content`(response-body.adoc 실측, 응답 본문 없음) —
 * 호출부(useCheckInMutation)가 attendanceKeys.all을 invalidate해 목록/요약을 재조회한다.
 */
export async function checkIn(): Promise<void> {
  await apiClient.post('/api/employees/attendances/me/check-in')
}
