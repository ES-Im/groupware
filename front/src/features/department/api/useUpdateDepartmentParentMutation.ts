import { useMutation, useQueryClient } from '@tanstack/react-query'
import { departmentKeys } from '../model/queryKeys'
import { updateDepartmentParent } from './updateDepartmentParent'

/**
 * 상위 부서 변경 mutation 훅(`DEPT_UPDATE_PARENT`, ROADMAP T9.1-b).
 * 변경 성공(204) 시 onSuccess에서 departmentKeys.all을 invalidate해 부서 상세
 * (useDepartmentInfoQuery, T6.2/T7.1)와 부서 목록(useDepartmentsQuery, T6.2)이 최신
 * 상위 부서 정보로 재조회되도록 한다(registerDepartment와 동일 패턴).
 * 소비처(F207 UI 배선)는 T9.3에서 담당한다.
 * 실패 시 에러는 그대로 던져 호출부가 handleApiError(T0.2c)로 위임하도록 둔다.
 */
export function useUpdateDepartmentParentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateDepartmentParent,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: departmentKeys.all })
    },
  })
}
