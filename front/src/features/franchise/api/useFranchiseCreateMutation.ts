import { useMutation, useQueryClient } from '@tanstack/react-query'
import { franchiseKeys } from '../model/queryKeys'
import { createFranchise } from './createFranchise'

export function useFranchiseCreateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createFranchise,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [...franchiseKeys.all, 'list'] })
    },
  })
}
