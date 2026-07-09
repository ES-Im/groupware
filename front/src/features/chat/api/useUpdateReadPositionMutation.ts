import { useMutation, useQueryClient } from '@tanstack/react-query'
import { chatKeys } from '../model/queryKeys'
import { updateChatRoomReadPosition } from './updateChatRoomReadPosition'

/**
 * 읽음 위치 갱신 mutation 훅(F911, ROADMAP(CHAT) T2.5). `useChatRoomSubscription`(T2.3-b)·
 * `useSendChatMessage`(T2.4)와 동일하게 이 방을 보고 있는 화면(ChatMessageArea)에서만 쓰이므로
 * roomId는 이미 확정된 number를 그대로 받는다(optional 가드 불필요 — ChatRoomDetailPage가
 * 상세 로드 성공 후에만 자식을 렌더).
 *
 * 실제 "언제 mutate를 호출할지"(방 진입 시·새 메시지 도달 시)는 `useReadPositionSync`가
 * 결정한다 — 이 훅은 순수하게 PATCH 호출 + 성공 후 목록 invalidate만 담당한다.
 *
 * onSuccess에서는 채팅방 목록(rooms) 쿼리만 invalidate한다. chatKeys.all 전체(bookmark
 * 토글 등 다른 mutation의 관례)를 쓰지 않는 이유: 새 메시지 도달마다 이 mutation이 반복
 * 호출될 수 있는데, chatKeys.all을 invalidate하면 이 방의 chatKeys.messages(roomId) 무한
 * 쿼리까지 함께 무효화돼 useChatRoomSubscription/useSendChatMessage가 setQueryData로 직접
 * 관리 중인 캐시가 불필요하게 재조회되며 스크롤 위치가 흔들릴 수 있다(과잉 무효화 방지).
 * 목록 쿼리는 keyword/isBookmark 필터 조합마다 캐시 키의 세 번째 요소(params)가 달라지므로,
 * chatKeys.rooms()처럼 params 자리에 undefined를 명시로 채우면 다른 필터 조합의 캐시와
 * 매칭되지 않는다(TanStack Query 부분 매칭은 대상 키 길이만큼만 비교) — 그래서 'rooms'
 * 세그먼트까지만 넘겨 필터와 무관하게 모든 rooms 쿼리를 매칭시킨다.
 */
export function useUpdateReadPositionMutation(roomId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (lastReadMessageId: number) =>
      updateChatRoomReadPosition(roomId, lastReadMessageId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [...chatKeys.all, 'rooms'] })
    },
  })
}
