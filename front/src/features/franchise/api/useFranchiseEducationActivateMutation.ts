import { useMutation, useQueryClient } from '@tanstack/react-query'
import { franchiseKeys } from '../model/queryKeys'
import { activateFranchiseEducation } from './toggleFranchiseEducationActive'

export function useFranchiseEducationActivateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (educationId: number) => activateFranchiseEducation(educationId),
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
