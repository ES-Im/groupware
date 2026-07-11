import { useMutation, useQueryClient } from '@tanstack/react-query'
import { messageKeys } from '../model/messageKeys'
import { updateDraftReceivers } from './updateDraftReceivers'

/** useMessageDraftReceiversUpdateMutation 호출 변수. messageId 대상 임시 쪽지 + 새 수신자 목록. */
interface MessageDraftReceiversUpdateVariables {
  messageId: number
  receiverIds: number[]
}

/**
 * 임시 쪽지 수신자 변경 mutation 훅(`MESSAGE_DRAFT_RECEIVERS_UPDATE`, F1517,
 * ROADMAP(MESSAGE) T5.2). 성공(204) 시 해당 쪽지 상세(messageKeys.detail)와 4박스 목록·건수
 * (messageKeys.all)를 함께 invalidate한다(useMessageDraftUpdateMutation과 동일 invalidate
 * 정책 — 두 mutation은 상호 의존 없는 별도 리소스라 호출부가 Promise.allSettled로 병렬 실행한다).
 * 실패는 onError 없이 그대로 전파해 호출부의 handleApiError가 위임받는다.
 */
export function useMessageDraftReceiversUpdateMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, unknown, MessageDraftReceiversUpdateVariables>({
    mutationFn: ({ messageId, receiverIds }) => updateDraftReceivers(messageId, receiverIds),
    onSuccess: async (_data, { messageId }) => {
      await queryClient.invalidateQueries({ queryKey: messageKeys.detail(messageId) })
      await queryClient.invalidateQueries({ queryKey: messageKeys.all })
    },
  })
}
