import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { boardKeys } from '../model/queryKeys'
import { getBoardList } from './getBoardList'

/**
 * 카테고리별 게시글 목록 조회 훅(ROADMAP T10.2, F301).
 *
 * categoryId가 아직 확정되지 않은 상태(예: CATEGORY_LIST 로딩 중이라 첫 카테고리를 아직 고르지
 * 못한 순간)에는 enabled:false로 훅 호출을 지연해 categoryId undefined인 채로 요청이 나가는
 * 것을 막는다(department 도메인 useDepartmentMembersQuery와 동일 가드 패턴). queryFn은 enabled
 * 가드로 인해 categoryId가 확정된 경우에만 실행되므로 number로 단언한다.
 *
 * params(keyword/page/size)는 queryKey에 그대로 포함되어 값이 바뀔 때마다 재요청된다.
 * placeholderData: keepPreviousData(department 목록 훅과 동일 패턴)로 검색어·페이지 변경 시
 * 새 응답이 도착하기 전까지 이전 목록을 유지해 화면이 매번 "불러오는 중..."으로 전면 교체되며
 * 깜빡이는 것을 막는다.
 */
export function useBoardListQuery(
  categoryId: number | undefined,
  params?: { keyword?: string; page?: number; size?: number },
) {
  return useQuery({
    queryKey: boardKeys.list(categoryId, params),
    queryFn: () => getBoardList(categoryId as number, params),
    enabled: categoryId != null,
    placeholderData: keepPreviousData,
  })
}
