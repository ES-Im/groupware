import { apiClient } from '@/shared/api/client'

/**
 * 쪽지 생성 요청 body(MESSAGE_SEND·MESSAGE_DRAFT_CREATE 공용, request-fields.adoc 실측).
 * 백엔드도 두 엔드포인트가 단일 MessageCreateRequest DTO를 공유한다 — receiverIds는
 * 임시저장(F1507)에서는 선택, 즉시 발송(F1506)에서는 필수(빈 배열 불가)이므로 여기서는
 * optional로 두고 발송 경로만 MessageSendRequest 교차 타입으로 필수화한다(누락 검증
 * 자체는 서버 책임 — MESSAGE_RECEIVER_REQUIRED_EXCEPTION).
 */
export interface MessageCreateRequest {
  /** 쪽지 제목(필수, 공백 불가, 50자 이하 — 서버 검증). */
  title: string
  /** 쪽지 내용(필수, 공백 불가 — 서버 검증). */
  content: string
  /** 수신자 식별 번호 목록. */
  receiverIds?: number[]
}

/** 즉시 발송 요청 body — 임시저장과 달리 receiverIds가 필수(빈 배열 불가). */
export type MessageSendRequest = MessageCreateRequest & { receiverIds: number[] }

/** 쪽지 생성/발송 응답(response-body.adoc 실측: 생성된 쪽지 식별 번호). */
export interface MessageCreateResult {
  messageId: number
}

/**
 * 쪽지 즉시 발송(MESSAGE_SEND, F1506, `POST /api/messages`, 활성 사원).
 * 성공 시 `201`과 `{messageId}`를 반환한다. 실패(수신자 누락·비활성 사원 등)는 에러를
 * 그대로 던져 호출부의 submitWithErrorMapping이 handleApiError로 위임하도록 둔다
 * (createLeaveDraft 동형).
 */
export async function sendMessage(payload: MessageSendRequest): Promise<MessageCreateResult> {
  const { data } = await apiClient.post<MessageCreateResult>('/api/messages', payload)
  return data
}
