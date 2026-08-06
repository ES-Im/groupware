import { useMutation, useQueryClient } from '@tanstack/react-query'
import { franchiseKeys } from '../model/queryKeys'
import { updateFranchise, type FranchiseUpdatePayload } from './updateFranchise'

interface FranchiseUpdateVariables {
  franchiseId: number
  payload: FranchiseUpdatePayload
}

export function useFranchiseUpdateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ franchiseId, payload }: FranchiseUpdateVariables) => updateFranchise(franchiseId, payload),
    onSuccess: async (_data, { franchiseId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: franchiseKeys.detail(franchiseId) }),
        queryClient.invalidateQueries({ queryKey: [...franchiseKeys.all, 'list'] }),
      ])
    },
  })
}
