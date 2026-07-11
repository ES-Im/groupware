import { useMutation, useQueryClient } from '@tanstack/react-query'
import { messageKeys } from '../model/messageKeys'
import { updateDraft, type UpdateDraftPayload } from './updateDraft'

/** useMessageDraftUpdateMutation 호출 변수. messageId 대상 임시 쪽지 + 제목/본문 저장 값. */
interface MessageDraftUpdateVariables {
  messageId: number
  payload: UpdateDraftPayload
}

/**
 * 임시 쪽지 제목/본문 수정 mutation 훅(`MESSAGE_DRAFT_UPDATE`, F1516, ROADMAP(MESSAGE) T5.2).
 * 성공(204) 시 해당 쪽지 상세(messageKeys.detail)와 4박스 목록·건수(messageKeys.all)를 함께
 * invalidate해 편집 뷰 재조회·임시보관함 목록에 수정 결과가 즉시 반영되게 한다
 * (useGeneralDraftUpdateMutation 동형). 실패는 onError 없이 그대로 전파해 호출부(편집 뷰 저장
 * 핸들러)의 handleApiError가 위임받는다.
 */
export function useMessageDraftUpdateMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, unknown, MessageDraftUpdateVariables>({
    mutationFn: ({ messageId, payload }) => updateDraft(messageId, payload),
    onSuccess: async (_data, { messageId }) => {
      await queryClient.invalidateQueries({ queryKey: messageKeys.detail(messageId) })
      await queryClient.invalidateQueries({ queryKey: messageKeys.all })
    },
  })
}
