import { useQuery } from '@tanstack/react-query'
import { boardKeys } from '../model/queryKeys'
import { getBoardDrafts } from './getBoardDrafts'

/**
 * 내 임시저장 게시글 목록 조회 훅(ROADMAP T12.1, F308).
 * boardKeys.drafts()(T10.2가 선언한 빌더)에 캐시한다. 파라미터가 없어 항상 활성 상태로 조회한다
 * (department 도메인의 파라미터 없는 목록 훅과 동일하게 enabled 가드가 필요 없다).
 * 내 임시저장함 페이지와 게시글 작성 페이지의 "임시저장글 불러오기" 토글(F308 재사용)이 동일하게
 * 이 훅을 소비한다.
 */
export function useBoardDraftsQuery() {
  return useQuery({
    queryKey: boardKeys.drafts(),
    queryFn: getBoardDrafts,
  })
}
