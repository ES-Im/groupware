import { useMutation, useQueryClient } from '@tanstack/react-query'
import { franchiseKeys } from '../model/queryKeys'
import { deactivateFranchiseEducation } from './toggleFranchiseEducationActive'

export function useFranchiseEducationDeactivateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (educationId: number) => deactivateFranchiseEducation(educationId),
    onSuccess: async (_data, educationId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: franchiseKeys.education.detail(educationId) }),
        queryClient.invalidateQueries({
          queryKey: [...franchiseKeys.all, 'education', 'calendar'],
        }),
      ])
    },
  })
}
