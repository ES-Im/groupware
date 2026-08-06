import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { handleApiError } from '@/shared/lib/apiError'
import { messageKeys } from '../model/messageKeys'
import { deleteMessage } from './deleteMessage'

export function useMessageDeleteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ messageId, isSentByMe }: { messageId: number; isSentByMe: boolean }) =>
      deleteMessage(messageId, isSentByMe),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: messageKeys.all })
      toast.success('쪽지를 완전 삭제했습니다')
    },
    onError: (error) => {
      handleApiError(error, { toast })
    },
  })
}
