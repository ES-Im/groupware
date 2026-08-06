import { useMutation, useQueryClient } from '@tanstack/react-query'
import { employeeKeys } from '../model/queryKeys'
import { activateEmp } from './activateEmp'

export function useActivateEmpMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (empId: number) => activateEmp(empId),
    onSuccess: async (_data, empId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: employeeKeys.detail(empId) }),
        queryClient.invalidateQueries({ queryKey: [...employeeKeys.all, 'empsForManagement'] }),
      ])
    },
  })
}
