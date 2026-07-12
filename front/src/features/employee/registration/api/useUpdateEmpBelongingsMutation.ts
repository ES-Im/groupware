import { useMutation, useQueryClient } from '@tanstack/react-query'
import { employeeKeys } from '../../model/queryKeys'
import type { EmpBelongingsCreatePayload } from '../model/empBelongingsCreatePayload'
import { updateEmpBelongings } from './updateEmpBelongings'

/**
 * HR/ADMIN의 신규 사원 소속 배정 mutation 훅(`HR_UPDATE_EMP_BELONGINGS`).
 * 성공(204) 시 가입대기자 목록(`newEmployees`) 캐시를 접두 무효화해 배정 완료된 사원이
 * 목록에서 사라지게 한다 — keyword/page 조합별 정확한 params를 모르는 이 훅에서는
 * exact:false 기본값으로 전부 무효화한다(useUpdateHrManagedInfoMutation과 동일 패턴).
 */
export function useUpdateEmpBelongingsMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ empId, payload }: { empId: number; payload: EmpBelongingsCreatePayload }) =>
      updateEmpBelongings(empId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: employeeKeys.newEmployees() }),
      ])
    },
  })
}
