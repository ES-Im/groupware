import { apiClient } from '@/shared/api/client'
import type { MessageCreateRequest, MessageCreateResult } from './sendMessage'

/**
 * 임시 쪽지 저장(MESSAGE_DRAFT_CREATE, F1507, `POST /api/messages/drafts`, 활성 사원).
 * 즉시 발송(sendMessage)과 동일 body/응답 계약을 공유하되 receiverIds가 선택이다
 * (수신자 없이도 임시보관함에 저장 가능). 성공 시 `201`과 `{messageId}`를 반환하며,
 * 실패는 에러를 그대로 던져 호출부의 submitWithErrorMapping이 handleApiError로
 * 위임하도록 둔다(createLeaveDraft 동형).
 */
export async function createDraft(payload: MessageCreateRequest): Promise<MessageCreateResult> {
  const { data } = await apiClient.post<MessageCreateResult>('/api/messages/drafts', payload)
  return data
}
