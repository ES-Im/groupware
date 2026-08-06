import { useMutation, useQueryClient } from '@tanstack/react-query'
import { messageKeys } from '../model/messageKeys'
import { uploadMessageFiles } from './uploadMessageFiles'

interface UploadMessageFilesVariables {
  messageId: number
  files: File[]
}

export function useUploadMessageFilesMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ messageId, files }: UploadMessageFilesVariables) =>
      uploadMessageFiles(messageId, files),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: messageKeys.all })
    },
  })
}
