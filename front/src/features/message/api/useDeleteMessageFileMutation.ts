import { useMutation, useQueryClient } from '@tanstack/react-query'
import { messageKeys } from '../model/messageKeys'
import { deleteMessageFile } from './deleteMessageFile'

interface DeleteMessageFileVariables {
  messageId: number
  fileId: number
}

export function useDeleteMessageFileMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, unknown, DeleteMessageFileVariables>({
    mutationFn: ({ messageId, fileId }) => deleteMessageFile(messageId, fileId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: messageKeys.all })
    },
  })
}
