import { useMutation, useQueryClient } from '@tanstack/react-query'
import { approvalKeys } from '../model/queryKeys'
import { deleteDraftFile } from './deleteDraftFile'

interface DraftFileDeleteVariables {
  draftId: number
  fileId: number
}

export function useDraftFileDeleteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ draftId, fileId }: DraftFileDeleteVariables) => deleteDraftFile(draftId, fileId),
    onSuccess: async (_data, { draftId }) => {
      await queryClient.invalidateQueries({ queryKey: approvalKeys.draftDetail(draftId) })
    },
  })
}
