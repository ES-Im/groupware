import { apiClient } from '@/shared/api/client'

/**
 * 포상 휴가 부여일수 조정(`EMP_LEAVE_ADJUST_COMPENSATORY_GRANT_DAYS`, F750, ROADMAP(LEAVE) M5 T5.2 →
 * `PATCH /api/employees/{empId}/leaves/compensatory-grant-days`, ADMIN 전용).
 *
 * adjustSpecialGrantDays와 동형(요청 본문 없음, plusMinusDays만 query string). empId는
 * 관리자 휴가 현황 요약 표(F747, T5.1) 응답 행의 empId를 그대로 사용한다.
 *
 * 성공 시 `204 No Content`(http-response.adoc 실측, 응답 본문 없음).
 */
export async function adjustCompensatoryGrantDays(empId: number, plusMinusDays: number): Promise<void> {
  await apiClient.patch(`/api/employees/${empId}/leaves/compensatory-grant-days`, null, {
    params: { plusMinusDays },
  })
}
