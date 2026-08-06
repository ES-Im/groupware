import { useMutation, useQueryClient } from '@tanstack/react-query'
import { departmentKeys } from '../model/queryKeys'
import { updateDepartmentParent } from './updateDepartmentParent'

export function useUpdateDepartmentParentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateDepartmentParent,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: departmentKeys.all })
    },
  })
}
