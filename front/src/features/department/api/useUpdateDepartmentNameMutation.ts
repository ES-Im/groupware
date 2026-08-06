import { useMutation, useQueryClient } from '@tanstack/react-query'
import { departmentKeys } from '../model/queryKeys'
import { updateDepartmentName } from './updateDepartmentName'

interface UpdateDepartmentNameVariables {
  deptId: number
  newName: string
}

export function useUpdateDepartmentNameMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ deptId, newName }: UpdateDepartmentNameVariables) =>
      updateDepartmentName(deptId, newName),
    onSuccess: async (_data, { deptId }) => {
      await queryClient.invalidateQueries({ queryKey: departmentKeys.detail(deptId) })
    },
  })
}
