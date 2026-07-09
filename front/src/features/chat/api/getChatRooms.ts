import { apiClient } from '@/shared/api/client'
import type { ChatRoomListItem } from '../model/chatRoom'

/**
 * 내 채팅방 목록 조회(`CHAT_ROOM_LIST`, api-endpoint.md 기능ID `CHAT_ROOM_LIST` →
 * `GET /api/chat/rooms`, minRole EMPLOYEE(본인)).
 *
 * keyword/isBookmark 쿼리 파라미터는 모두 선택값이다(query-parameters.adoc 실측). 값이 없는
 * 파라미터는 쿼리스트링 자체에서 생략되도록 params 객체에 조건부로만 채운다(department 도메인
 * getDepartments와 동일 패턴).
 *
 * 응답은 Spring Page가 아닌 **plain array**다(response-body.adoc 실측) — Page 매핑 없이
 * 배열 그대로 반환한다. 서버가 본인이 참여 중인 방만 선별해 내려준다(PRD §서버 최종 판단).
 */
export async function getChatRooms(params?: {
  keyword?: string
  isBookmark?: boolean
}): Promise<ChatRoomListItem[]> {
  const query: Record<string, string | boolean> = {}
  if (params?.keyword) {
    query.keyword = params.keyword
  }
  if (params?.isBookmark != null) {
    query.isBookmark = params.isBookmark
  }
  const { data } = await apiClient.get<ChatRoomListItem[]>('/api/chat/rooms', { params: query })
  return data
}
