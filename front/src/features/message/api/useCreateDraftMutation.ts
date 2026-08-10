import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { RegisterDomainIdResponse } from '@/shared/api/registerDomainIdResponse'
import { messageKeys } from '../model/messageKeys'
import { createDraft } from './createDraft'
import type { MessageCreateRequest } from './sendMessage'

export function useCreateDraftMutation() {
  const queryClient = useQueryClient()

  return useMutation<RegisterDomainIdResponse, unknown, MessageCreateRequest>({
    mutationFn: createDraft,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: messageKeys.all })
    },
  })
}
