import { apiClient } from '@/shared/api/client'

/**
 * HR/ADMIN의 신규 사원 가입 승인(`HR_APPROVE_EMP_REGISTRATION`, api-endpoint.md 기능ID
 * `HR_APPROVE_EMP_REGISTRATION` → `PATCH /api/employees/{empId}/registration-approval?hiredAt=`).
 * 요청 바디 없음(스니펫 http-request.adoc 실측 — `Content-Type: application/x-www-form-urlencoded`,
 * 바디 값 없음). hiredAt은 쿼리 파라미터로만 전송하고, 바디 자리엔 undefined가 아닌 null을 명시
 * 전달해 axios가 Content-Type을 임의로 바꾸지 않도록 한다. 성공 시 `204 No Content`.
 */
export async function approveEmpRegistration(empId: number, hiredAt: string): Promise<void> {
  await apiClient.patch(`/api/employees/${empId}/registration-approval`, null, { params: { hiredAt } })
}
