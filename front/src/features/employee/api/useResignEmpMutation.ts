import { useMutation, useQueryClient } from '@tanstack/react-query'
import { employeeKeys } from '../model/queryKeys'
import { resignEmp } from './resignEmp'

/**
 * 사원 퇴직 처리 mutation 훅(`HR_RESIGN_EMP`).
 * 성공(204) 시 employeeKeys.detail(empId)와 empsForManagement 캐시 전체를 invalidate한다
 * (useActivateEmpMutation과 동일 패턴).
 */
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
