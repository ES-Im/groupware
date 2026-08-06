import { useMutation, useQueryClient } from '@tanstack/react-query'
import { employeeKeys } from '../model/queryKeys'
import { suspendEmp } from './suspendEmp'

export function useSuspendEmpMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (empId: number) => suspendEmp(empId),
    onSuccess: async (_data, empId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: employeeKeys.detail(empId) }),
        queryClient.invalidateQueries({ queryKey: [...employeeKeys.all, 'empsForManagement'] }),
      ])
    },
  })
}
