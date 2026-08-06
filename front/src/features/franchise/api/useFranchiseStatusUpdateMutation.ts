import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { BusinessStatusCode } from '../model/franchise'
import { franchiseKeys } from '../model/queryKeys'
import { updateFranchiseStatus } from './updateFranchiseStatus'

interface FranchiseStatusUpdateVariables {
  franchiseId: number
  status: BusinessStatusCode
}

export function useFranchiseStatusUpdateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ franchiseId, status }: FranchiseStatusUpdateVariables) =>
      updateFranchiseStatus(franchiseId, status),
    onSuccess: async (_data, { franchiseId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: franchiseKeys.detail(franchiseId) }),
        queryClient.invalidateQueries({ queryKey: [...franchiseKeys.all, 'list'] }),
      ])
    },
  })
}
