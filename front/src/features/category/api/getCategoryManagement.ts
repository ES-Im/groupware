import { apiClient } from '@/shared/api/client'
import type { CategoryManagementPage } from '../model/category'

/**
 * 카테고리 관리 목록 조회(`CATEGORY_MANAGEMENT`, api-endpoint.md 기능ID `CATEGORY_MANAGEMENT` →
 * `GET /api/categories/management`, minRole ADMIN).
 *
 * keyword/isVisible/page/size 쿼리 파라미터는 모두 선택값이다(query-parameters.adoc 실측).
 * 값이 없는 파라미터는 쿼리스트링 자체에서 생략되도록 params 객체에 조건부로만 채운다
 * (getFranchises 동형).
 */
export async function getCategoryManagement(params?: {
  keyword?: string
  isVisible?: boolean
  page?: number
  size?: number
}): Promise<CategoryManagementPage> {
  const query: Record<string, string | number | boolean> = {}
  if (params?.keyword) {
    query.keyword = params.keyword
  }
  if (params?.isVisible != null) {
    query.isVisible = params.isVisible
  }
  if (params?.page != null) {
    query.page = params.page
  }
  if (params?.size != null) {
    query.size = params.size
  }
  const { data } = await apiClient.get<CategoryManagementPage>('/api/categories/management', {
    params: query,
  })
  return data
}
