import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { approvalKeys } from '../model/queryKeys'
import type { DocumentBoxQueryParams } from '../model/approval'
import { getMySubmittedDrafts } from './getMySubmittedDrafts'

/**
 * 상신함 목록 조회 훅(`MY_SUBMITTED_DRAFTS`, ROADMAP(DRAFT) T1.5, F712).
 *
 * params(keyword/page/size)는 queryKey(approvalKeys.submitted)에 그대로 포함되어 값이 바뀔 때마다
 * 재요청된다. placeholderData: keepPreviousData(attendance/board 목록 훅과 동일)로 검색·페이지 변경
 * 시 새 응답 도착 전까지 이전 목록을 유지해 표가 매번 전면 교체되며 깜빡이는 것을 막는다.
 */
export function useMySubmittedDraftsQuery(params?: DocumentBoxQueryParams) {
  return useQuery({
    queryKey: approvalKeys.submitted(params),
    queryFn: () => getMySubmittedDrafts(params),
    placeholderData: keepPreviousData,
  })
}
