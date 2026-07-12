import { apiClient } from '@/shared/api/client'
import type { NewEmployeesPage } from '../model/newEmployee'

/**
 * 가입 대기(신규) 사원 목록 조회(`NEW_EMP_LIST`, api-endpoint.md 기능ID `NEW_EMP_LIST` →
 * `GET /api/employees/new`). keyword/page/size 전부 선택값(query-parameters.adoc)이라, 값이
 * 없는 파라미터는 쿼리스트링 자체에서 생략되도록 조건부로만 채운다(getEmpsForManagement와 동일 컨벤션).
 */
export async function getNewEmployees(params?: {
  keyword?: string
  page?: number
  size?: number
}): Promise<NewEmployeesPage> {
  const query: Record<string, string | number> = {}
  if (params?.keyword) {
    query.keyword = params.keyword
  }
  if (params?.page != null) {
    query.page = params.page
  }
  if (params?.size != null) {
    query.size = params.size
  }
  const { data } = await apiClient.get<NewEmployeesPage>('/api/employees/new', { params: query })
  return data
}
