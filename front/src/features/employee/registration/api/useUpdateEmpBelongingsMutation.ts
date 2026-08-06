import { useMutation, useQueryClient } from '@tanstack/react-query'
import { employeeKeys } from '../../model/queryKeys'
import type { EmpBelongingsCreatePayload } from '../model/empBelongingsCreatePayload'
import { updateEmpBelongings } from './updateEmpBelongings'

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
