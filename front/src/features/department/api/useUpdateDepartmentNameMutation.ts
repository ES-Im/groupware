import { useMutation, useQueryClient } from '@tanstack/react-query'
import { departmentKeys } from '../model/queryKeys'
import { updateDepartmentName } from './updateDepartmentName'

/** useUpdateDepartmentNameMutation 호출 변수. */
interface UpdateDepartmentNameVariables {
  deptId: number
  newName: string
}

/**
 * 부서명 변경 mutation 훅(`DEPT_UPDATE_NAME`, ROADMAP T9.1-a).
 * 성공(204) 시 onSuccess에서 departmentKeys.detail(deptId)를 invalidate해 useDepartmentInfoQuery
 * (T7.1)가 변경된 부서명으로 재조회되도록 한다. 실패 시 에러는 그대로 던져 호출부(T9.2)가
 * handleApiError(T0.2c)로 위임하도록 둔다.
 */
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
