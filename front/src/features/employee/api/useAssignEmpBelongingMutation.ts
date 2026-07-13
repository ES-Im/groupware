import { useMutation, useQueryClient } from '@tanstack/react-query'
import { employeeKeys } from '../model/queryKeys'
import { updateEmpBelongings } from '../registration/api/updateEmpBelongings'
import type { PositionCode } from '../registration/model/positionCode'

interface AssignEmpBelongingInput {
  empId: number
  deptId: number
  position: PositionCode
  startAt: string
}

/**
 * 소속이 없는 재직 사원에게 최초 소속을 배정하는 mutation(`HR_UPDATE_EMP_BELONGINGS` 단발 호출).
 *
 * 전보(useTransferEmpBelongingMutation)와 달리 종료할 현재 주요 소속이 없으므로, "현재 소속 종료"
 * ①단계 없이 신규 소속 등록(deptId≠null, isPrimary:true, endAt:null)만 한 번 호출한다 — 마법사
 * 2단계(useUpdateEmpBelongingsMutation)와 동일한 최초 배정 경로다.
 *
 * 다만 호출 맥락이 사원관리 목록/상세라, newEmployees만 무효화하는 registration의
 * useUpdateEmpBelongingsMutation과 달리 detail·empsForManagement 캐시를 무효화한다
 * (useTransferEmpBelongingMutation과 동일 무효화 세트).
 */
export function useAssignEmpBelongingMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ empId, deptId, position, startAt }: AssignEmpBelongingInput) =>
      updateEmpBelongings(empId, {
        deptId,
        position,
        isPrimary: true,
        startAt,
        endAt: null,
      }),
    onSuccess: async (_data, { empId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: employeeKeys.detail(empId) }),
        queryClient.invalidateQueries({ queryKey: [...employeeKeys.all, 'empsForManagement'] }),
      ])
    },
  })
}
