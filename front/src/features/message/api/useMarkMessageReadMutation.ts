import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { handleApiError } from '@/shared/lib/apiError'
import { messageKeys } from '../model/messageKeys'
import { markMessageRead } from './markMessageRead'

export function useMarkMessageReadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (messageId: number) => markMessageRead(messageId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: messageKeys.all })
    },
    onError: (error) => {
      handleApiError(error, { toast })
    },
  })
}
