import { apiClient } from '@/shared/api/client'

/**
 * 퇴근 체크아웃(`MY_ATTENDANCE_CHECK_OUT`, api-endpoint.md 기능ID `MY_ATTENDANCE_CHECK_OUT` →
 * `PATCH /api/employees/attendances/me/check-out`, minRole EMPLOYEE).
 *
 * 요청 본문 없음(back/build/generated-snippets/MY_ATTENDANCE_CHECK_OUT/curl-request.adoc·
 * request-body.adoc 실측). 성공 시 `204 No Content`(response-body.adoc 실측, 응답 본문 없음) —
 * 호출부(useCheckOutMutation)가 attendanceKeys.all을 invalidate해 목록/요약을 재조회한다.
 */
export async function checkOut(): Promise<void> {
  await apiClient.patch('/api/employees/attendances/me/check-out')
}
