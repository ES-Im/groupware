import { useMutation, useQueryClient } from '@tanstack/react-query'
import { messageKeys } from '../model/messageKeys'
import { deleteDraft } from './deleteDraft'

/**
 * 임시 쪽지 삭제 mutation 훅(`MESSAGE_DRAFT_DELETE`, F1518, ROADMAP(MESSAGE) T5.3-a).
 *
 * onError를 정의하지 않아 에러가 그대로 전파된다 — 호출부의 submitWithErrorMapping이
 * 실패 처리를 위임받는다(useSendDraftMutation과 동일 컨벤션).
 *
 * 성공 시 messageKeys.all을 invalidate해 임시보관함·휴지통 목록과 counts 배지가 함께
 * 갱신되도록 한다.
 */
export function useDeleteDraftMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, unknown, { messageId: number }>({
    mutationFn: ({ messageId }) => deleteDraft(messageId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: messageKeys.all })
    },
  })
}
