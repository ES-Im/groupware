import { useMutation, useQueryClient } from '@tanstack/react-query'
import { messageKeys } from '../model/messageKeys'
import { deleteDraft } from './deleteDraft'

export function useDeleteDraftMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, unknown, { messageId: number }>({
    mutationFn: ({ messageId }) => deleteDraft(messageId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: messageKeys.all })
    },
  })
}
