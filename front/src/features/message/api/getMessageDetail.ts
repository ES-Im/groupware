import { apiClient } from '@/shared/api/client'
import type { MessageDetailResponse } from '../model/messageTypes'

/**
 * 쪽지 상세 조회(F1505 → `GET /api/messages/{messageId}`, ROADMAP(MESSAGE) T3.1).
 *
 * 조회 GET 7종 공통으로 REST Docs 미커버(api-endpoint.md 미등재)라 백엔드 컨트롤러
 * (MessageQueryApi)·DTO 소스를 ground truth로 사용한다(PRD 15.message-prd.md §참조 계약 매핑).
 * 발신자·수신자 본인만 열람 가능하며(서버 최종 판정), 그 외 접근의 403/404 처리는
 * 호출부 apiError 매핑으로 위임한다. approval getDraftDetail과 동일하게 이 GET 자체는
 * 부작용이 없다 — 받은 쪽지 읽음 처리는 별도 F1511(markMessageRead)이 담당한다.
 */
export async function getMessageDetail(messageId: number): Promise<MessageDetailResponse> {
  const { data } = await apiClient.get<MessageDetailResponse>(`/api/messages/${messageId}`)
  return data
}
