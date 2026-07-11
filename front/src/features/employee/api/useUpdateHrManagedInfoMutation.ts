import { useMutation, useQueryClient } from '@tanstack/react-query'
import { employeeKeys } from '../model/queryKeys'
import type { UpdateHrManagedInfoRequest } from './updateHrManagedInfo'
import { updateHrManagedInfo } from './updateHrManagedInfo'

/**
 * HR/ADMIN의 특정 사원 정보 수정 mutation 훅.
 * 성공(204) 시 employeeKeys.detail(empId)(RETRIEVE_EMP_INFO)와 empsForManagement 캐시 전체를
 * invalidate한다 — 후자는 deptId/size 조합별로 여러 캐시 엔트리가 있을 수 있어(useEmpForManagementQuery)
 * 정확한 params를 모르는 이 훅에서는 접두 키(exact:false 기본값)로 전부 무효화한다
 * (useApproveAttendanceMutation 등 기존 부서 스코프 무효화와 동일 패턴).
 */
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
