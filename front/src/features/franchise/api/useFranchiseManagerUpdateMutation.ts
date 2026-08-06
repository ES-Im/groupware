import { useMutation, useQueryClient } from '@tanstack/react-query'
import { franchiseKeys } from '../model/queryKeys'
import { updateFranchiseManager } from './updateFranchiseManager'

interface FranchiseManagerUpdateVariables {
  franchiseId: number
  newManagerId: number
}

export function useFranchiseManagerUpdateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ franchiseId, newManagerId }: FranchiseManagerUpdateVariables) =>
      updateFranchiseManager(franchiseId, newManagerId),
    onSuccess: async (_data, { franchiseId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: franchiseKeys.detail(franchiseId) }),
        queryClient.invalidateQueries({ queryKey: [...franchiseKeys.all, 'list'] }),
      ])
    },
  })
}
