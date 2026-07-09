import { apiClient } from '@/shared/api/client'
import type { EmpLeaveSummaryPage } from '../model/leave'

/**
 * 관리자 전사 사원 휴가 요약 조회(`EMP_LEAVE_SUMMARY`, F747, ROADMAP(LEAVE) M5 T5.1 →
 * `GET /api/employees/leaves/summary`, ADMIN 전용).
 *
 * keyword/deptId/year/page/size 쿼리 파라미터는 전부 선택값이다(query-parameters.adoc 실측).
 * deptId 미지정 시 전사 전체가 조회 대상이다. 값이 없는 파라미터는 쿼리스트링 자체에서
 * 생략되도록 params 객체에 조건부로만 채운다(getDeptAttendanceMonthly와 동일 패턴).
 *
 * 응답은 Spring Data Page 표준 구조(EmpLeaveSummaryPage = Page<EmpLeaveSummaryRow>) 그대로
 * 반환한다. content[].empId는 F749/F750 조정 mutation의 empId path param으로 그대로 재사용된다
 * (별도 사원 검색 불필요, PRD §계약 실측 메모).
 */
export async function getEmpLeaveSummary(params?: {
  keyword?: string
  deptId?: number
  year?: number
  page?: number
  size?: number
}): Promise<EmpLeaveSummaryPage> {
  const query: Record<string, string | number> = {}
  if (params?.keyword) {
    query.keyword = params.keyword
  }
  if (params?.deptId != null) {
    query.deptId = params.deptId
  }
  if (params?.year != null) {
    query.year = params.year
  }
  if (params?.page != null) {
    query.page = params.page
  }
  if (params?.size != null) {
    query.size = params.size
  }
  const { data } = await apiClient.get<EmpLeaveSummaryPage>('/api/employees/leaves/summary', {
    params: query,
  })
  return data
}
