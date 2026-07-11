import { useMutation, useQueryClient } from '@tanstack/react-query'
import { employeeKeys } from '../model/queryKeys'
import type { UpdateDeptManagedInfoRequest } from './updateDeptManagedInfo'
import { updateDeptManagedInfo } from './updateDeptManagedInfo'

/**
 * DEPT_MANAGER/ADMIN의 특정 사원 정보 수정 mutation 훅.
 * invalidate 범위는 useUpdateHrManagedInfoMutation과 동일(detail + empsForManagement 전체).
 */
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
