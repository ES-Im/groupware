import { useMutation, useQueryClient } from '@tanstack/react-query'
import { departmentKeys } from '../model/queryKeys'
import { endDepartmentLeader } from './endDepartmentLeader'

/**
 * 현재 부서장 종료 mutation 훅(`DEPT_END_LEADER`, ROADMAP T9.1-b).
 * 종료 성공(204) 시 onSuccess에서 departmentKeys.all을 invalidate해 부서 상세
 * (useDepartmentInfoQuery, T6.2/T7.1)와 부서 목록(useDepartmentsQuery, T6.2)이 재조회되며,
 * 공석 정규화(normalizeDeptLeader, T6.1)가 자동 적용되도록 한다(registerDepartment와 동일 패턴).
 * 소비처(F209 UI 배선)는 T9.3에서 담당한다.
 * 실패 시 에러는 그대로 던져 호출부가 handleApiError(T0.2c)로 위임하도록 둔다.
 */
export function useEndDepartmentLeaderMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: endDepartmentLeader,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: departmentKeys.all })
    },
  })
}
