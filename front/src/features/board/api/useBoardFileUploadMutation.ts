import { useMutation, useQueryClient } from '@tanstack/react-query'
import { validateBoardFileUpload } from '../lib/fileValidation'
import type { BoardFileInfo } from '../model/board'
import { boardKeys } from '../model/queryKeys'
import { uploadBoardFile } from './uploadBoardFile'

interface BoardFileUploadVariables {
  boardId: number
  files: File[]
  existingFiles?: BoardFileInfo[]
}

export function useBoardFileUploadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ boardId, files, existingFiles = [] }: BoardFileUploadVariables) => {
      validateBoardFileUpload(files, existingFiles)

      for (const file of files) {
        await uploadBoardFile(boardId, file)
      }
    },
    onSuccess: async (_data, { boardId }) => {
      await queryClient.invalidateQueries({ queryKey: boardKeys.files(boardId) })
    },
  })
}
