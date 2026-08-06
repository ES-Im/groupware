import { useMutation, useQueryClient } from '@tanstack/react-query'
import { departmentKeys } from '../model/queryKeys'
import { deactivateDepartment } from './deactivateDepartment'

export function useDeactivateDepartmentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (deptId: number) => deactivateDepartment(deptId),
    onSuccess: async (_data, deptId) => {
      await queryClient.invalidateQueries({ queryKey: departmentKeys.detail(deptId) })
    },
  })
}
