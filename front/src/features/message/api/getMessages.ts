import { apiClient } from '@/shared/api/client'
import type { MailBox, MessagesResponse } from '../model/messageTypes'

/**
 * Spring Data Page 표준 구조(docs/backend-contract/page.md).
 * approval/board 등 타 도메인과 동형이며, 도메인마다 독립 정의하는 기존 컨벤션을 그대로 따른다
 * (공유 제네릭 승격은 이번 태스크 범위 밖). model/messageTypes.ts는 T1.2(순수 응답 DTO 선언)
 * 산출물이라 건드리지 않고, Page를 처음 소비하는 이 파일에 함께 둔다.
 */
export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  numberOfElements: number
  first: boolean
  last: boolean
  empty: boolean
}

/**
 * 4박스 목록 조회 공통 쿼리 파라미터. isRead는 받은함(received) 전용이며
 * 다른 박스에서는 전송하지 않는다(백엔드 MessageQueryApi 실측 — received만 isRead를 받는다).
 */
export interface MessageListQueryParams {
  keyword?: string
  isRead?: boolean
  page?: number
  size?: number
}

/**
 * 쪽지함 4박스(받은/보낸/임시보관/휴지통) 목록 조회(F1501~F1504 →
 * `GET /api/messages/{received|sent|drafts|trash}`, minRole EMPLOYEE(본인)).
 *
 * 4개 박스는 동일 응답 타입(Page<MessagesResponse>)·거의 동일 쿼리 구조의 variant라
 * box 파라미터를 받는 단일 함수로 구현한다(박스별 함수 4개 분리는 오버엔지니어링 —
 * ROADMAP(MESSAGE) T2.1 결정). 값이 없는 파라미터는 쿼리스트링에서 생략되도록 조건부로만
 * 채우고(approval getMySubmittedDrafts와 동일 패턴), isRead는 백엔드가 받은함에서만
 * 지원하므로 box==='received'일 때만 전송한다. number(0-based)는 파싱 단계에서 변환하지
 * 않고 UI 소비 시점에 +1한다(docs/backend-contract/page.md 컨벤션).
 */
export async function getMessages(
  box: MailBox,
  params?: MessageListQueryParams,
): Promise<Page<MessagesResponse>> {
  const query: Record<string, string | number | boolean> = {}
  if (params?.keyword) {
    query.keyword = params.keyword
  }
  if (box === 'received' && params?.isRead != null) {
    query.isRead = params.isRead
  }
  if (params?.page != null) {
    query.page = params.page
  }
  if (params?.size != null) {
    query.size = params.size
  }
  const { data } = await apiClient.get<Page<MessagesResponse>>(`/api/messages/${box}`, {
    params: query,
  })
  return data
}
