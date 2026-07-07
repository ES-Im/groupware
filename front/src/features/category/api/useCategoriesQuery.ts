import { useQuery } from '@tanstack/react-query'
import { categoryKeys } from '../model/queryKeys'
import { getCategories } from './getCategories'

/**
 * 노출 카테고리 목록 조회 훅(ROADMAP T10.2, F302). 게시판 목록 페이지의 카테고리 셀렉트
 * 소스(첫 항목 기본 선택은 소비 화면 T10.3의 몫)로 재사용된다. 파라미터가 없는 단순 목록
 * 조회라 department 도메인의 필터형 목록 훅과 달리 keepPreviousData/enabled 가드가 필요 없다.
 */
export function useCategoriesQuery() {
  return useQuery({
    queryKey: categoryKeys.list(),
    queryFn: getCategories,
  })
}
