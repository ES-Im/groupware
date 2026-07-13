import { useMutation, useQueryClient } from '@tanstack/react-query'
import { employeeKeys } from '../model/queryKeys'
import { suspendEmp } from './suspendEmp'

/**
 * 사원 정직 처리 mutation 훅(`HR_SUSPEND_EMP`).
 * 성공(204) 시 employeeKeys.detail(empId)와 empsForManagement 캐시 전체를 invalidate한다
 * (useActivateEmpMutation과 동일 패턴).
 */
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
