import { useMutation, useQueryClient } from '@tanstack/react-query'
import { franchiseKeys } from '../model/queryKeys'
import {
  updateFranchiseEducation,
  type FranchiseEducationUpdatePayload,
} from './updateFranchiseEducation'

interface FranchiseEducationUpdateVariables {
  educationId: number
  payload: FranchiseEducationUpdatePayload
}

export function useFranchiseEducationUpdateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ educationId, payload }: FranchiseEducationUpdateVariables) =>
      updateFranchiseEducation(educationId, payload),
    onSuccess: async (_data, { educationId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: franchiseKeys.education.detail(educationId) }),
        queryClient.invalidateQueries({
          queryKey: [...franchiseKeys.all, 'education', 'calendar'],
        }),
      ])
    },
  })
}
