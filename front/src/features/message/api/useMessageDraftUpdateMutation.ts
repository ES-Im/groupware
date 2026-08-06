import { useMutation, useQueryClient } from '@tanstack/react-query'
import { messageKeys } from '../model/messageKeys'
import { updateDraft, type UpdateDraftPayload } from './updateDraft'

interface MessageDraftUpdateVariables {
  messageId: number
  payload: UpdateDraftPayload
}

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
