import { useQuery } from '@tanstack/react-query'
import { messageKeys } from '../model/messageKeys'
import { getMailboxCounts } from './getMailboxCounts'

/**
 * 메일박스 건수 조회 훅(ROADMAP(MESSAGE) T1.4, F1510).
 *
 * 사이드바 "쪽지함" 안읽음 배지(LayoutShell → badgeCounts.messageUnread, unreadReceivedCount)와
 * 쪽지함 페이지의 4박스 탭 건수 배지(T2.2)가 공유 소비한다. 실시간(STOMP) 계약이 없는 도메인이라
 * 갱신은 이후 뮤테이션 태스크들의 messageKeys.all invalidate로만 이뤄진다(재조회 단일 경로).
 */
export function useMailboxCountsQuery() {
  return useQuery({
    queryKey: messageKeys.counts(),
    queryFn: getMailboxCounts,
  })
}
