import { useQuery } from '@tanstack/react-query'
import { approvalKeys } from '../model/queryKeys'
import { getMyPendingApprovalDraftsCount } from './getMyPendingApprovalDraftsCount'

/**
 * 결재 대기 건수 조회 훅(`MY_PENDING_APPROVAL_DRAFTS_COUNT`, ROADMAP(DRAFT) T7.1, F711).
 *
 * 사이드바 "결재대기함" 메뉴 뱃지가 소비한다(T7.3 — LayoutShell에서 호출해 Sidebar로 count를 주입).
 * 단일 정수(bare number) 응답이라 placeholderData 불필요. 결재 액션(M3 승인/반려)이나 상신/철회
 * (M4) 성공 시 approvalKeys.all invalidate로 이 뱃지 건수가 함께 갱신된다.
 */
export function useMyPendingApprovalDraftsCountQuery() {
  return useQuery({
    queryKey: approvalKeys.pendingCount(),
    queryFn: getMyPendingApprovalDraftsCount,
  })
}
