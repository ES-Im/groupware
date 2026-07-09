import { useQuery } from '@tanstack/react-query'
import { approvalKeys } from '../model/queryKeys'
import { getMyDocumentBoxSummary } from './getMyDocumentBoxSummary'

/**
 * 문서함 요약 조회 훅(`MY_DOCUMENT_BOX_SUMMARY`, ROADMAP(DRAFT) T7.1, F715).
 *
 * 단일 객체 응답이라 목록 훅과 달리 페이지네이션 깜빡임 이슈가 없어 placeholderData: keepPreviousData는
 * 적용하지 않는다(attendance useMyAttendanceMonthlySummaryQuery와 동일). 문서함 홈(DocumentBoxHomePage)
 * 요약 카드 4종이 소비한다. 결재 액션(M3 승인/반려) 성공 시 approvalKeys.all invalidate로 갱신된다.
 */
export function useMyDocumentBoxSummaryQuery() {
  return useQuery({
    queryKey: approvalKeys.summary(),
    queryFn: getMyDocumentBoxSummary,
  })
}
