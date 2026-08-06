import { useMutation, useQueryClient } from '@tanstack/react-query'
import { franchiseKeys } from '../model/queryKeys'
import { clearFranchiseMemo } from './clearFranchiseMemo'

export function useFranchiseMemoClearMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (franchiseId: number) => clearFranchiseMemo(franchiseId),
    onSuccess: async (_data, franchiseId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: franchiseKeys.detail(franchiseId) }),
        queryClient.invalidateQueries({ queryKey: [...franchiseKeys.all, 'list'] }),
      ])
    },
  })
}
