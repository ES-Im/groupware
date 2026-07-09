import { useMutation, useQueryClient } from '@tanstack/react-query'
import { chatKeys } from '../model/queryKeys'
import { createChatRoom, type CreateChatRoomPayload, type CreateChatRoomResult } from './createChatRoom'

/**
 * 채팅방 생성 mutation 훅(F906, ROADMAP(CHAT) T3.1-b).
 * 성공 시 chatKeys.all을 invalidate해 목록(T1.2)이 새로 생성된 방을 반영하도록 한다. 생성된
 * roomId로의 이동(`navigate`)은 라우팅 책임을 훅이 갖지 않고 호출부(CreateChatRoomDialog)의
 * mutate onSuccess가 직접 수행한다(useGeneralDraftCreateMutation과 동일 컨벤션 — mutation 훅은
 * 캐시 갱신만, 이동은 화면). 실패는 에러를 그대로 던져 호출부가 handleApiError(sonner 토스트)로
 * 처리하도록 둔다.
 */
export function useCreateChatRoomMutation() {
  const queryClient = useQueryClient()

  return useMutation<CreateChatRoomResult, unknown, CreateChatRoomPayload>({
    mutationFn: createChatRoom,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: chatKeys.all })
    },
  })
}
