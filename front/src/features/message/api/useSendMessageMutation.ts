import { useMutation, useQueryClient } from '@tanstack/react-query'
import { messageKeys } from '../model/messageKeys'
import { sendMessage, type MessageCreateResult, type MessageSendRequest } from './sendMessage'

export function useSendMessageMutation() {
  const queryClient = useQueryClient()

  return useMutation<MessageCreateResult, unknown, MessageSendRequest>({
    mutationFn: sendMessage,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: messageKeys.all })
    },
  })
}
