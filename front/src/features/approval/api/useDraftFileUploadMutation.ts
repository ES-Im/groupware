import { useMutation, useQueryClient } from '@tanstack/react-query'
import { validateDraftFileUpload } from '../lib/draftFileValidation'
import type { DraftFile } from '../model/draftDetail'
import { approvalKeys } from '../model/queryKeys'
import { uploadDraftFile } from './uploadDraftFile'

interface DraftFileUploadVariables {
  draftId: number
  files: File[]
  existingFiles?: DraftFile[]
}

export function useDraftFileUploadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ draftId, files, existingFiles = [] }: DraftFileUploadVariables) => {
      validateDraftFileUpload(files, existingFiles)

      for (const file of files) {
        await uploadDraftFile(draftId, file)
      }
    },
    onSuccess: async (_data, { draftId }) => {
      await queryClient.invalidateQueries({ queryKey: approvalKeys.draftDetail(draftId) })
    },
  })
}
