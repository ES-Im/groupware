import { apiClient } from '@/shared/api/client'
import type { MessageCountResponse } from '../model/messageTypes'

/**
 * 메일박스 건수 조회(F1510 → `GET /api/messages/mailboxes/counts`, minRole EMPLOYEE(본인)).
 *
 * 조회 GET은 REST Docs 미커버(api-endpoint.md 미등재)라 백엔드 컨트롤러(MessageQueryApi)·DTO
 * 소스를 실측한 PRD §참조 계약 매핑이 ground truth다. 응답은 bare number가 아닌
 * MessageCountResponse 객체(5개 건수 필드)이므로 approval 건수 조회와 달리 정규화가 필요 없다.
 * 사이드바 안읽음 배지(T1.4)와 목록 탭 건수 배지(T2.2)가 단일 소스로 공유 소비한다.
 */
export async function getMailboxCounts(): Promise<MessageCountResponse> {
  const { data } = await apiClient.get<MessageCountResponse>('/api/messages/mailboxes/counts')
  return data
}
