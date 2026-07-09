import { apiClient } from '@/shared/api/client'
import type { DeptLeaveSummaryParams } from '../model/deptLeave'
import type { EmpLeaveSummaryPage } from '../model/leave'

/**
 * 부서원 휴가 요약 조회(`DEPT_EMP_LEAVE_SUMMARY`, F745 →
 * `GET /api/departments/{deptId}/employees/leaves/summary`, DEPT_MANAGER(같은 부서) 또는 ADMIN).
 *
 * 응답 shape(`EmpLeaveSummaryPage` = `Page<EmpLeaveSummaryRow>`)는 `EMP_LEAVE_SUMMARY`(M5)와
 * 완전히 동형이라 `model/leave.ts`의 기존 타입을 그대로 재사용한다(신규 타입 발명 금지).
 *
 * keyword/year/page/size 쿼리 파라미터는 전부 선택값이다(query-parameters.adoc 실측). year 미입력
 * 시 서버가 현재 연도를 기본값으로 적용한다. 값이 없는 파라미터는 쿼리스트링 자체에서 생략되도록
 * params 객체에 조건부로만 채운다.
 *
 * 타 부서 접근 시 서버가 403(ROLE_003)을 반환하며, 이 함수는 별도 처리 없이 그대로 throw한다
 * (호출부가 handleApiError로 정규화 소비, 재구현 금지).
 */
export async function getDeptEmpLeaveSummary(
  deptId: number,
  params?: DeptLeaveSummaryParams,
): Promise<EmpLeaveSummaryPage> {
  const query: Record<string, string | number> = {}
  if (params?.keyword) {
    query.keyword = params.keyword
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
  const { data } = await apiClient.get<EmpLeaveSummaryPage>(
    `/api/departments/${deptId}/employees/leaves/summary`,
    { params: query },
  )
  return data
}
