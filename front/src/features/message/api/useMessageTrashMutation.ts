import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { handleApiError } from '@/shared/lib/apiError'
import { messageKeys } from '../model/messageKeys'
import { trashMessage } from './trashMessage'

export function useMessageTrashMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ messageId, isSentByMe }: { messageId: number; isSentByMe: boolean }) =>
      trashMessage(messageId, isSentByMe),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: messageKeys.all })
      toast.success('쪽지를 휴지통으로 이동했습니다')
    },
    onError: (error) => {
      handleApiError(error, { toast })
    },
  })
}
