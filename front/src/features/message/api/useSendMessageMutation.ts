import { useMutation, useQueryClient } from '@tanstack/react-query'
import { messageKeys } from '../model/messageKeys'
import { sendMessage, type MessageCreateResult, type MessageSendRequest } from './sendMessage'

/**
 * 쪽지 즉시 발송 mutation 훅(`MESSAGE_SEND`, F1506, ROADMAP(MESSAGE) T4.2).
 * 성공(201, `{messageId}`) 시 messageKeys.all을 invalidate해 4박스 목록·건수 배지를
 * 한 번에 최신화한다. 실패는 onError 없이 에러를 그대로 전파해 호출부(작성 폼)의
 * submitWithErrorMapping이 handleApiError로 위임하도록 둔다(useLeaveDraftCreateMutation
 * 동형). 첨부 있는 발송 경로(draft-first 오케스트레이션)는 T4.3 범위.
 */
export function useSendMessageMutation() {
  const queryClient = useQueryClient()

  return useMutation<MessageCreateResult, unknown, MessageSendRequest>({
    mutationFn: sendMessage,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: messageKeys.all })
    },
  })
}
