import { apiClient } from '@/shared/api/client'
import type { FranchiseEducationApplicantsPage } from '../model/franchise'

/**
 * 교육 신청자 목록 조회(`FRANCHISE_EDUCATION_APPLICANTS`, api-endpoint.md 기능ID
 * `FRANCHISE_EDUCATION_APPLICANTS` → `GET /api/franchise-educations/{educationId}/applicants`,
 * minRole FRANCHISE 또는 ADMIN).
 *
 * page/size 쿼리 파라미터는 모두 선택값이다(query-parameters.adoc 실측). 값이 없는 파라미터는
 * 쿼리스트링 자체에서 생략되도록 params 객체에 조건부로만 채운다(getFranchises 동형).
 */
export async function getFranchiseEducationApplicants(
  educationId: number,
  params?: { page?: number; size?: number },
): Promise<FranchiseEducationApplicantsPage> {
  const query: Record<string, number> = {}
  if (params?.page != null) {
    query.page = params.page
  }
  if (params?.size != null) {
    query.size = params.size
  }
  const { data } = await apiClient.get<FranchiseEducationApplicantsPage>(
    `/api/franchise-educations/${educationId}/applicants`,
    { params: query },
  )
  return data
}
