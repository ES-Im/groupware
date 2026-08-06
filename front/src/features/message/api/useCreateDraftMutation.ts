import { useMutation, useQueryClient } from '@tanstack/react-query'
import { messageKeys } from '../model/messageKeys'
import { createDraft } from './createDraft'
import type { MessageCreateRequest, MessageCreateResult } from './sendMessage'

export function useCreateDraftMutation() {
  const queryClient = useQueryClient()

  return useMutation<MessageCreateResult, unknown, MessageCreateRequest>({
    mutationFn: createDraft,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: messageKeys.all })
    },
  })
}
