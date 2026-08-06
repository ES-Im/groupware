import { useMutation, useQueryClient } from '@tanstack/react-query'
import { franchiseKeys } from '../model/queryKeys'
import { deleteEducationFile } from './deleteEducationFile'

interface EducationFileDeleteVariables {
  educationId: number
  fileId: number
}

export function useEducationFileDeleteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ educationId, fileId }: EducationFileDeleteVariables) =>
      deleteEducationFile(educationId, fileId),
    onSuccess: async (_data, { educationId }) => {
      await queryClient.invalidateQueries({
        queryKey: franchiseKeys.education.detail(educationId),
      })
    },
  })
}
