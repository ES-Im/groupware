import { apiClient } from '@/shared/api/client'
import type { CategoryItem } from '../model/category'

/**
 * 노출 카테고리 목록 조회(`CATEGORY_LIST`, api-endpoint.md 기능ID `CATEGORY_LIST` →
 * `GET /api/categories`, minRole EMPLOYEE). path/query 파라미터 없음(Empty request).
 * 엔드포인트명("노출 카테고리 목록")대로 서버가 이미 노출(isVisible) 카테고리만 반환하므로
 * 프론트에서 별도 필터링을 하지 않는다(§참조 계약 매핑).
 */
export async function getCategories(): Promise<CategoryItem[]> {
  const { data } = await apiClient.get<CategoryItem[]>('/api/categories')
  return data
}
