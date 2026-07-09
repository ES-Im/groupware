import { useMutation, useQueryClient } from '@tanstack/react-query'
import { chatKeys } from '../model/queryKeys'
import { leaveChatRoom } from './leaveChatRoom'

/**
 * 채팅방 나가기 mutation 훅(F909, ROADMAP(CHAT) T4.4). `useUpdateReadPositionMutation`과
 * 동일하게 이 방(roomId)에 고정된 설정 메뉴(ChatRoomSettingsMenu)에서만 쓰이므로 roomId는
 * 이미 확정된 number를 그대로 받는다(optional 가드 불필요).
 *
 * onSuccess에서는 채팅방 목록(rooms) 쿼리만 invalidate한다(`useUpdateReadPositionMutation`과
 * 동일 사유·동일 스코프 — code-reviewer 지적 반영). bookmark 토글 등 다른 mutation의 관례인
 * chatKeys.all 전체를 쓰지 않는 이유: chatKeys.all을 invalidate하면 방금 나간 방의
 * chatKeys.detail(roomId)·chatKeys.messages(roomId) 쿼리까지 함께 무효화된다. TanStack Query는
 * 이 mutation 훅의 onSuccess(await invalidate = refetch까지 완료)를 먼저 끝낸 뒤에야 호출부
 * (LeaveChatRoomDialog)의 onSuccess(backToList())를 실행하므로, 아직 대화 상세 패널이
 * 마운트된 상태에서 방금 나간 방의 GET detail/messages가 재조회되어 403/404(비멤버) 에러가
 * 잠깐 노출되거나 불필요한 요청이 발생할 수 있다(과잉 무효화 방지). 목록 쿼리는
 * keyword/isBookmark 필터 조합마다 캐시 키의 세 번째 요소(params)가 달라지므로,
 * chatKeys.rooms()처럼 params 자리에 undefined를 명시로 채우면 다른 필터 조합의 캐시와
 * 매칭되지 않는다(TanStack Query 부분 매칭은 대상 키 길이만큼만 비교) — 그래서 'rooms'
 * 세그먼트까지만 넘겨 필터와 무관하게 모든 rooms 쿼리를 매칭시킨다.
 *
 * `useCreateChatRoomMutation`과 동일 컨벤션으로 mutation 훅은 캐시 갱신만 담당하고, 목록
 * 패널로의 전환(오버레이 스토어 `backToList`)은 호출부(LeaveChatRoomDialog)의 onSuccess가
 * 수행한다. 실패는 에러를 그대로 던져 호출부가 handleApiError(sonner 토스트)로 처리하도록 둔다.
 */
export function useLeaveChatRoomMutation(roomId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => leaveChatRoom(roomId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [...chatKeys.all, 'rooms'] })
    },
  })
}
