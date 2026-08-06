import { useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { employeeKeys } from '../model/queryKeys'
import { updateEmpBelongings } from '../registration/api/updateEmpBelongings'
import type { PositionCode } from '../registration/model/positionCode'

interface TransferEmpBelongingInput {
  empId: number
  currentPrimaryStartAt: string
  deptId: number
  position: PositionCode
  startAt: string
}

export function useTransferEmpBelongingMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      empId,
      currentPrimaryStartAt,
      deptId,
      position,
      startAt,
    }: TransferEmpBelongingInput) => {
      const endAt = dayjs(startAt).subtract(1, 'day').format('YYYY-MM-DD')

      await updateEmpBelongings(empId, {
        deptId: null,
        position: null,
        isPrimary: null,
        startAt: currentPrimaryStartAt,
        endAt,
      })

      await updateEmpBelongings(empId, {
        deptId,
        position,
        isPrimary: true,
        startAt,
        endAt: null,
      })
    },
    onSuccess: async (_data, { empId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: employeeKeys.detail(empId) }),
        queryClient.invalidateQueries({ queryKey: [...employeeKeys.all, 'empsForManagement'] }),
      ])
    },
  })
}
