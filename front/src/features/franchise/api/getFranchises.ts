import { apiClient } from '@/shared/api/client'
import type { FranchisesPage } from '../model/franchise'

/**
 * 가맹점 목록 조회(`FRANCHISE_LIST`, api-endpoint.md 기능ID `FRANCHISE_LIST` →
 * `GET /api/franchises`, minRole FRANCHISE 또는 ADMIN).
 *
 * keyword/status/managerId/page/size 쿼리 파라미터는 모두 선택값이다(query-parameters.adoc 실측).
 * 값이 없는 파라미터는 쿼리스트링 자체에서 생략되도록 params 객체에 조건부로만 채운다
 * (`getDepartments` 동형). FranchisePicker(T1.2)의 담당 기본뷰(managerId)·전체 검색(keyword)
 * 모드 전환이 이 조건부 채움에 의존한다.
 */
export async function getFranchises(params?: {
  keyword?: string
  status?: string
  managerId?: number
  page?: number
  size?: number
}): Promise<FranchisesPage> {
  const query: Record<string, string | number> = {}
  if (params?.keyword) {
    query.keyword = params.keyword
  }
  if (params?.status) {
    query.status = params.status
  }
  if (params?.managerId != null) {
    query.managerId = params.managerId
  }
  if (params?.page != null) {
    query.page = params.page
  }
  if (params?.size != null) {
    query.size = params.size
  }
  const { data } = await apiClient.get<FranchisesPage>('/api/franchises', { params: query })
  return data
}
