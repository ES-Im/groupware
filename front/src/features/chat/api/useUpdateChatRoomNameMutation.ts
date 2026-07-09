import { useMutation, useQueryClient } from '@tanstack/react-query'
import { chatKeys } from '../model/queryKeys'
import { updateChatRoomName } from './updateChatRoomName'

interface UpdateChatRoomNameVariables {
  roomId: number
  name: string
}

/**
 * 채팅방 표시명 수정 mutation 훅(F908, ROADMAP(CHAT) T4.3).
 *
 * 성공(204) 시 `chatKeys.all`을 invalidate해 상세(T2.1, `ChatRoomDetailPage` 헤더)와
 * 목록(T1.2, `ChatRoomListPage`) 둘 다 갱신한다 — `useToggleBookmarkMutation`(T1.3)과 동일
 * 컨벤션. `chatKeys.detail(roomId)`는 `chatKeys.all`의 하위 키라 별도로 다시 invalidate할
 * 필요가 없다(TanStack Query 부분 매칭 — 상위 키를 invalidate하면 하위 키도 함께 무효화).
 *
 * 실패 시 에러는 그대로 던져 호출부(ChatRoomNameUpdateDialog)가 submitWithErrorMapping →
 * handleApiError로 폼 루트 에러 매핑하도록 둔다.
 */
export function useUpdateChatRoomNameMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ roomId, name }: UpdateChatRoomNameVariables) => updateChatRoomName(roomId, name),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: chatKeys.all })
    },
  })
}
