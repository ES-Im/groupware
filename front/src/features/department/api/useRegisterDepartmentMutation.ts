import { useMutation, useQueryClient } from '@tanstack/react-query'
import { departmentKeys } from '../model/queryKeys'
import { registerDepartment } from './registerDepartment'

export function useRegisterDepartmentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: registerDepartment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: departmentKeys.all })
    },
  })
}
