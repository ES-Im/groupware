import { useMutation, useQueryClient } from '@tanstack/react-query'
import { departmentKeys } from '../model/queryKeys'
import { endDepartmentLeader } from './endDepartmentLeader'

export function useEndDepartmentLeaderMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: endDepartmentLeader,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: departmentKeys.all })
    },
  })
}
