import { apiClient } from '@/shared/api/client'
import type { MyLeaveSummary } from '../model/myLeave'

/**
 * 내 잔여 휴가 요약 조회(`MY_EMP_LEAVE_SUMMARY`, F743, ROADMAP(LEAVE) M3 T3.1 →
 * `GET /api/employees/me/leaves/summary`, minRole EMPLOYEE(본인)).
 *
 * 단일 객체 응답(Page 아님). year 쿼리 파라미터는 선택값이며(query-parameters.adoc 실측) 미입력 시
 * 서버가 현재 연도를 기본값으로 적용한다. 잔여(연차/특별/포상)는 서버가 내려주지 않아 호출부
 * (MyLeavePage)가 이 응답의 부여/사용 값으로 프론트에서 계산한다.
 */
export async function getMyLeaveSummary(params?: { year?: number }): Promise<MyLeaveSummary> {
  const query: Record<string, number> = {}
  if (params?.year != null) {
    query.year = params.year
  }
  const { data } = await apiClient.get<MyLeaveSummary>('/api/employees/me/leaves/summary', {
    params: query,
  })
  return data
}
