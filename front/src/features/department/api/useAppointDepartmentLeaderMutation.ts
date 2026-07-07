import { useMutation, useQueryClient } from '@tanstack/react-query'
import { departmentKeys } from '../model/queryKeys'
import { appointDepartmentLeader } from './appointDepartmentLeader'

/** useAppointDepartmentLeaderMutation 호출 변수. appointedAt은 `yyyy-MM-dd` 포맷 문자열이어야 한다. */
interface AppointDepartmentLeaderVariables {
  deptId: number
  leaderEmpId: number
  appointedAt: string
}

/**
 * 부서장 지정 mutation 훅(`DEPT_APPOINT_LEADER`, ROADMAP T9.1-a).
 * 성공(204) 시 onSuccess에서 departmentKeys.detail(deptId)를 invalidate해 useDepartmentInfoQuery
 * (T7.1)가 새 부서장 정보로 재조회되도록 한다. 실패 시 에러는 그대로 던져 호출부(T9.2)가
 * handleApiError(T0.2c)로 위임하도록 둔다.
 */
export function useAppointDepartmentLeaderMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ deptId, leaderEmpId, appointedAt }: AppointDepartmentLeaderVariables) =>
      appointDepartmentLeader(deptId, { leaderEmpId, appointedAt }),
    onSuccess: async (_data, { deptId }) => {
      await queryClient.invalidateQueries({ queryKey: departmentKeys.detail(deptId) })
    },
  })
}
