import { useMutation, useQueryClient } from '@tanstack/react-query'
import { employeeKeys } from '../model/queryKeys'
import { resignEmp } from './resignEmp'

export function useResignEmpMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ empId, resignAt }: { empId: number; resignAt: string }) => resignEmp(empId, resignAt),
    onSuccess: async (_data, { empId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: employeeKeys.detail(empId) }),
        queryClient.invalidateQueries({ queryKey: [...employeeKeys.all, 'empsForManagement'] }),
      ])
    },
  })
}
