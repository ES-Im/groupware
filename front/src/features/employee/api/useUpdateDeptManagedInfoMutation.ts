import { useMutation, useQueryClient } from '@tanstack/react-query'
import { employeeKeys } from '../model/queryKeys'
import type { UpdateDeptManagedInfoRequest } from './updateDeptManagedInfo'
import { updateDeptManagedInfo } from './updateDeptManagedInfo'

export function useUpdateDeptManagedInfoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ empId, values }: { empId: number; values: UpdateDeptManagedInfoRequest }) =>
      updateDeptManagedInfo(empId, values),
    onSuccess: async (_data, { empId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: employeeKeys.detail(empId) }),
        queryClient.invalidateQueries({ queryKey: [...employeeKeys.all, 'empsForManagement'] }),
      ])
    },
  })
}
