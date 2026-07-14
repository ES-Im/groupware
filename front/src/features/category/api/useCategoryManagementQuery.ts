import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { categoryKeys } from '../model/queryKeys'
import { getCategoryManagement } from './getCategoryManagement'

/**
 * 카테고리 관리 목록 조회 훅(`CATEGORY_MANAGEMENT`, ADMIN 전용). CategoryManagementPanel이
 * 검색어·노출필터·페이지 변경마다 재호출한다. placeholderData: keepPreviousData로 필터/페이지
 * 전환 중에도 이전 목록을 유지해 화면이 매번 "불러오는 중..."으로 전면 교체되는 깜빡임을 막는다
 * (useFranchisesQuery 동형).
 */
export function useCategoryManagementQuery(params?: {
  keyword?: string
  isVisible?: boolean
  page?: number
  size?: number
}) {
  return useQuery({
    queryKey: categoryKeys.management(params),
    queryFn: () => getCategoryManagement(params),
    placeholderData: keepPreviousData,
  })
}
