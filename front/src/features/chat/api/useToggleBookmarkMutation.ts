import { useMutation, useQueryClient } from '@tanstack/react-query'
import { chatKeys } from '../model/queryKeys'
import { bookmarkChatRoom } from './bookmarkChatRoom'
import { unbookmarkChatRoom } from './unbookmarkChatRoom'

interface ToggleBookmarkVariables {
  roomId: number
  /** 토글 직전(현재) 즐겨찾기 상태. true면 해제(unbookmark), false/undefined면 등록(bookmark)을 호출한다. */
  isBookmarked: boolean
}

/**
 * 채팅방 즐겨찾기 토글 mutation 훅(F910, ROADMAP(CHAT) T1.3).
 * `CHAT_ROOM_BOOKMARK`/`CHAT_ROOM_UNBOOKMARK` 둘 다 body 없음·204 — 현재 isBookmarked에 따라
 * 분기 호출한다(§참조 계약 매핑: "현재 isBookmarked로 토글 분기").
 *
 * 성공 시 chatKeys.all을 invalidate해 목록(T1.2)뿐 아니라 이후 대화 화면 상세(T4.1이 이 훅을
 * 그대로 재사용)까지 함께 갱신되도록 한다. 실패 시 에러는 그대로 던져 호출부가
 * handleApiError(sonner 토스트)로 처리하도록 둔다(department 도메인 mutation과 동일 컨벤션).
 *
 * roomId별로 훅을 개별 호출할 수 없는 목록 화면(행마다 별도 훅 호출은 Hooks 규칙 위반) 구조를
 * 고려해, 훅 자체는 인자 없이 최상위에서 한 번만 호출하고 mutate 시점에 variables로 대상 방을
 * 넘기는 방식을 택했다.
 */
export function useToggleBookmarkMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ roomId, isBookmarked }: ToggleBookmarkVariables) =>
      isBookmarked ? unbookmarkChatRoom(roomId) : bookmarkChatRoom(roomId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: chatKeys.all })
    },
  })
}
