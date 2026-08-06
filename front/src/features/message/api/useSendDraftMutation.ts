import { useMutation, useQueryClient } from '@tanstack/react-query'
import { messageKeys } from '../model/messageKeys'
import { sendDraft } from './sendDraft'

export function useSendDraftMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (messageId: number) => sendDraft(messageId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: messageKeys.all })
    },
  })
}
