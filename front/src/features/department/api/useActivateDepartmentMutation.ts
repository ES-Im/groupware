import { useMutation, useQueryClient } from '@tanstack/react-query'
import { departmentKeys } from '../model/queryKeys'
import { activateDepartment } from './activateDepartment'

/**
 * 부서 활성화 mutation 훅(`DEPT_ACTIVATE`, ROADMAP T9.1-a).
 * 성공(204) 시 onSuccess에서 departmentKeys.detail(deptId)를 invalidate해 useDepartmentInfoQuery
 * (T7.1)가 최신 활성 상태로 재조회되도록 한다. 실패 시 에러는 그대로 던져 호출부(T9.2)가
 * handleApiError(T0.2c)로 위임하도록 둔다.
 */
export function useActivateDepartmentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (deptId: number) => activateDepartment(deptId),
    onSuccess: async (_data, deptId) => {
      await queryClient.invalidateQueries({ queryKey: departmentKeys.detail(deptId) })
    },
  })
}
