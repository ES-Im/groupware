import { apiClient } from '@/shared/api/client'

/**
 * 특별 휴가 부여일수 조정(`EMP_LEAVE_ADJUST_SPECIAL_GRANT_DAYS`, F749, ROADMAP(LEAVE) M5 T5.2 →
 * `PATCH /api/employees/{empId}/leaves/special-grant-days`, ADMIN 전용).
 *
 * 요청 본문 없음(body 없음), plusMinusDays만 query string으로 전달한다(query-parameters.adoc
 * 실측: 필수, 음수 입력 시 차감, 예시값 1.5 — 0.5일 단위 소수 허용, 정수 강제 금지).
 * empId는 관리자 휴가 현황 요약 표(F747, T5.1) 응답 행의 empId를 그대로 사용한다(별도 사원
 * 검색 신설 없음).
 *
 * 성공 시 `204 No Content`(response-body.adoc 부재 → http-response.adoc 실측, 응답 본문 없음).
 */
export async function adjustSpecialGrantDays(empId: number, plusMinusDays: number): Promise<void> {
  await apiClient.patch(`/api/employees/${empId}/leaves/special-grant-days`, null, {
    params: { plusMinusDays },
  })
}
