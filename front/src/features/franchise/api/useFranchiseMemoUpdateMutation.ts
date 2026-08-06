import { useMutation, useQueryClient } from '@tanstack/react-query'
import { franchiseKeys } from '../model/queryKeys'
import { updateFranchiseMemo } from './updateFranchiseMemo'

interface FranchiseMemoUpdateVariables {
  franchiseId: number
  memo: string
}

export function useFranchiseMemoUpdateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ franchiseId, memo }: FranchiseMemoUpdateVariables) =>
      updateFranchiseMemo(franchiseId, memo),
    onSuccess: async (_data, { franchiseId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: franchiseKeys.detail(franchiseId) }),
        queryClient.invalidateQueries({ queryKey: [...franchiseKeys.all, 'list'] }),
      ])
    },
  })
}
