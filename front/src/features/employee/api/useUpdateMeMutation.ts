import { useMutation, useQueryClient } from '@tanstack/react-query'
import { employeeKeys } from '../model/queryKeys'
import { updateMe } from './updateMe'

/**
 * 내 정보 수정 mutation 훅(ROADMAP T3.1).
 * 저장 성공(204) 시 onSuccess에서 employeeKeys.me()를 invalidate해 useMeQuery(T1.3)가
 * 최신 데이터로 재조회되도록 한다. 실패 시 에러는 그대로 던져 호출부(UpdateMeForm의
 * submitWithErrorMapping)가 handleApiError(T0.2c)로 위임하도록 둔다.
 */
export function useUpdateMeMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateMe,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: employeeKeys.me() })
    },
  })
}
