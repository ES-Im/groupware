import { useMutation, useQueryClient } from '@tanstack/react-query'
import { messageKeys } from '../model/messageKeys'
import { updateDraftReceivers } from './updateDraftReceivers'

interface MessageDraftReceiversUpdateVariables {
  messageId: number
  receiverIds: number[]
}

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
