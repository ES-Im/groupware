import { apiClient } from '@/shared/api/client'
import type { MyLeaveHistoryEntry, MyLeaveHistoryParams } from '../model/myLeave'

/**
 * 내 휴가 신청 이력 조회(`MY_LEAVE_REQUEST_HISTORY`, F742, ROADMAP(LEAVE) M3 T3.1 →
 * `GET /api/leaves/employees/me/request-history`, minRole EMPLOYEE(본인)).
 *
 * **배열 응답(페이징 없음)** — 최상위가 바로 `MyLeaveHistoryEntry[]`다(response-fields.adoc 실측:
 * `[].draftId` 등 배열 인덱스 표기, approval `getMyBusinessTripHistory`와 동형).
 * approvalStatus/yearMonth 쿼리 파라미터는 둘 다 선택값이다(query-parameters.adoc 실측). yearMonth
 * 미입력 시 서버가 현재 월을 기본값으로 적용한다. 값이 없는 파라미터는 쿼리스트링 자체에서
 * 생략되도록 params 객체에 조건부로만 채운다(getMyBusinessTripHistory/getMyAttendanceMonthly와 동일 패턴).
 */
export async function getMyLeaveHistory(
  params?: MyLeaveHistoryParams,
): Promise<MyLeaveHistoryEntry[]> {
  const query: Record<string, string> = {}
  if (params?.approvalStatus) {
    query.approvalStatus = params.approvalStatus
  }
  if (params?.yearMonth) {
    query.yearMonth = params.yearMonth
  }
  const { data } = await apiClient.get<MyLeaveHistoryEntry[]>(
    '/api/leaves/employees/me/request-history',
    { params: query },
  )
  return data
}
