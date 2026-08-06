import { useMutation, useQueryClient } from '@tanstack/react-query'
import { employeeKeys } from '../model/queryKeys'
import type { UpdateHrManagedInfoRequest } from './updateHrManagedInfo'
import { updateHrManagedInfo } from './updateHrManagedInfo'

export function useUpdateHrManagedInfoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ empId, values }: { empId: number; values: UpdateHrManagedInfoRequest }) =>
      updateHrManagedInfo(empId, values),
    onSuccess: async (_data, { empId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: employeeKeys.detail(empId) }),
        queryClient.invalidateQueries({ queryKey: [...employeeKeys.all, 'empsForManagement'] }),
      ])
    },
  })
}
