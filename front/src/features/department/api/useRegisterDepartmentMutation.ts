import { useMutation, useQueryClient } from '@tanstack/react-query'
import { departmentKeys } from '../model/queryKeys'
import { registerDepartment } from './registerDepartment'

/**
 * 부서 등록 mutation 훅(`DEPT_REGISTER`, ROADMAP T8.1).
 * 등록 성공(204) 시 onSuccess에서 departmentKeys.all을 invalidate해 부서 목록(useDepartmentsQuery,
 * T6.2)이 최신 데이터로 재조회되도록 한다(detail/members 캐시도 all 하위라 함께 무효화되지만,
 * 신규 등록이 기존 상세/멤버 화면에 영향을 주지 않으므로 부작용은 없다).
 * 실패 시 에러는 그대로 던져 호출부(RegisterDepartmentDialog의 submitWithErrorMapping)가
 * handleApiError(T0.2c)로 위임하도록 둔다.
 */
export function useRegisterDepartmentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: registerDepartment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: departmentKeys.all })
    },
  })
}
