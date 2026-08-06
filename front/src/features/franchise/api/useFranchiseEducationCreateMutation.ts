import { useMutation, useQueryClient } from '@tanstack/react-query'
import { franchiseKeys } from '../model/queryKeys'
import { createFranchiseEducation } from './createFranchiseEducation'

export function useFranchiseEducationCreateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createFranchiseEducation,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [...franchiseKeys.all, 'education', 'calendar'] })
    },
  })
}
