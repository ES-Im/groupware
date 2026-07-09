import { apiClient } from '@/shared/api/client'

/**
 * 부서 근태 승인(`DEPT_ATTENDANCE_APPROVE`, api-endpoint.md 기능ID `DEPT_ATTENDANCE_APPROVE` →
 * `PATCH /api/employees/attendances/{attendanceId}/approval`, minRole DEPT_MANAGER).
 *
 * path-parameters.adoc/query-parameters.adoc 실측대로 요청 본문은 없고(body 없음),
 * targetEmpId(필수, 근태 대상 사원 식별 번호)·approvedAt(필수, ISO DATE_TIME) 두 값 모두
 * query string으로 전달한다. attendanceId는 부서 승인대기 목록 조회(F306, T3.3) 응답의
 * `content[].attendanceInfo.attendanceId`를 그대로 사용한다 — 별도 조회를 신설하지 않는다
 * (updateAttendance의 attendanceId 재사용 원칙과 동일).
 *
 * approvedAt은 서버가 채우는 값이 아니라 승인 버튼 클릭 시각을 클라이언트가 dayjs로 합성해
 * 전달한다(PRD §참조 계약 매핑 확정, 호출부 useApproveAttendanceMutation 참조).
 *
 * 성공 시 `204 No Content`(response-body.adoc 부재 → http-response.adoc 실측, 응답 본문 없음).
 */
export async function approveAttendance(
  attendanceId: number,
  targetEmpId: number,
  approvedAt: string,
): Promise<void> {
  await apiClient.patch(`/api/employees/attendances/${attendanceId}/approval`, null, {
    params: { targetEmpId, approvedAt },
  })
}
