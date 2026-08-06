import { useMutation, useQueryClient } from '@tanstack/react-query'
import { validateEducationFileUpload } from '../lib/educationFileValidation'
import type { FranchiseEducationFileInfo } from '../model/franchise'
import { franchiseKeys } from '../model/queryKeys'
import { uploadEducationFile } from './uploadEducationFile'

interface EducationFileUploadVariables {
  educationId: number
  files: File[]
  existingFiles?: FranchiseEducationFileInfo[]
}

export function useEducationFileUploadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      educationId,
      files,
      existingFiles = [],
    }: EducationFileUploadVariables) => {
      validateEducationFileUpload(files, existingFiles)

      for (const file of files) {
        await uploadEducationFile(educationId, file)
      }
    },
    onSuccess: async (_data, { educationId }) => {
      await queryClient.invalidateQueries({
        queryKey: franchiseKeys.education.detail(educationId),
      })
    },
  })
}
