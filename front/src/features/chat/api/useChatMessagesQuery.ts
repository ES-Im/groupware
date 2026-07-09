import { useInfiniteQuery } from '@tanstack/react-query'
import { chatKeys } from '../model/queryKeys'
import { getChatMessages } from './getChatMessages'

/** 한 페이지에 요청할 메시지 수(서버 기본값과 동일하게 명시적으로 고정, ChatApiDocsTest.java 실측). */
const PAGE_SIZE = 50

/**
 * 채팅 메시지 목록 cursor 무한스크롤 훅(`CHAT_MESSAGES`, ROADMAP(CHAT) T2.2, F903).
 *
 * queryKey는 `chatKeys.messages(roomId)`만 사용하고 cursor/size는 담지 않는다 — useInfiniteQuery는
 * 여러 페이지를 단일 쿼리 캐시 엔트리(`data.pages`) 아래에 누적 관리하므로, cursor를 queryKey에
 * 실으면 페이지마다 별도 캐시 엔트리로 쪼개져 무한스크롤이 깨진다(cursor는 getNextPageParam이
 * pageParam으로 별도 추적). chatKeys.messages(roomId, params?)의 params 인자는 이 훅에서 쓰지 않는다.
 *
 * WHY(T2.1 리뷰 참고): chatKeys.detail(roomId) = ['chat','room',roomId]는 chatKeys.messages(roomId)
 * = ['chat','room',roomId,'messages',undefined]의 배열 프리픽스다. 이 훅은 invalidate를 호출하지
 * 않으므로 이번 태스크에서는 영향이 없지만, 이후 T2.5(읽음 위치 갱신)가 chatKeys.detail(roomId)를
 * invalidate하면 react-query의 prefix 매칭으로 이 메시지 쿼리도 함께 무효화된다는 점을 그때 고려해야
 * 한다.
 *
 * roomId가 아직 확정되지 않은 상태(라우트 파라미터 파싱 전·유효성 실패)에는 enabled:false로 지연한다
 * (useChatRoomDetailQuery 동형 가드).
 *
 * 페이지 내부 정렬 순서(newest-first vs oldest-first)는 계약에 미문서화됐다(PRD Open Q#5) — 서버가
 * 내려준 messages[] 배열 순서를 그대로 신뢰하고 이 훅에서는 뒤집지 않는다. cursor 시맨틱("이전
 * 페이지 기준 메시지 식별 번호")상 페이지를 거듭 fetch할수록 과거로 향한다고 가정([INFERENCE])해
 * 최초 페이지(cursor 없음)를 최신 배치로 본다 — 이 가정에 따른 "페이지 나열 순서" 조정은 소비 화면
 * (ChatRoomDetailPage)이 담당한다. //todo Open Q#5 확정 필요.
 */
export function useChatMessagesQuery(roomId: number | undefined) {
  return useInfiniteQuery({
    queryKey: chatKeys.messages(roomId),
    queryFn: ({ pageParam }) =>
      getChatMessages(roomId as number, { cursor: pageParam, size: PAGE_SIZE }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? (lastPage.nextCursor ?? undefined) : undefined),
    enabled: roomId != null,
  })
}
