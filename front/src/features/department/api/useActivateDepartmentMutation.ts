import { useMutation, useQueryClient } from '@tanstack/react-query'
import { departmentKeys } from '../model/queryKeys'
import { activateDepartment } from './activateDepartment'

export function useActivateDepartmentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (deptId: number) => activateDepartment(deptId),
    onSuccess: async (_data, deptId) => {
      await queryClient.invalidateQueries({ queryKey: departmentKeys.detail(deptId) })
    },
  })
}
