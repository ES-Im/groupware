import { useMutation, useQueryClient } from '@tanstack/react-query'
import { employeeKeys } from '../model/queryKeys'
import { activateEmp } from './activateEmp'

/**
 * 사원 활성화 mutation 훅(`HR_ACTIVATE_EMP`).
 * 성공(204) 시 employeeKeys.detail(empId)와 empsForManagement 캐시 전체를 invalidate한다
 * (useUpdateHrManagedInfoMutation과 동일 패턴 — 후자는 deptId/size 조합별 캐시가 여럿이라
 * 접두 키로 전부 무효화한다).
 */
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
