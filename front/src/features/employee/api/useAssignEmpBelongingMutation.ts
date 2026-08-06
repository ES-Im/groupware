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
