import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { BusinessStatusCode } from '../model/franchise'
import { franchiseKeys } from '../model/queryKeys'
import { updateFranchiseStatus } from './updateFranchiseStatus'

/** useFranchiseStatusUpdateMutation 호출 변수. */
interface FranchiseStatusUpdateVariables {
  franchiseId: number
  status: BusinessStatusCode
}

/**
 * 가맹점 영업상태 변경 mutation 훅(`FRANCHISE_STATUS_UPDATE`, ROADMAP(FRANCHISE) T2.4-b, F1605).
 * 성공(204) 시 상세(`franchiseKeys.detail`)와 목록 접두사(`[...all, 'list']`)를 함께 invalidate
 * 한다 — BusinessStatus는 목록(P1)에도 노출되고 status 필터 축이기도 하다(T2.4-a
 * useFranchiseUpdateMutation과 동일 접두사 근거). 실패 시 에러는 그대로 던져 호출부가
 * handleApiError로 위임하도록 둔다.
 */
export function useFranchiseStatusUpdateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ franchiseId, status }: FranchiseStatusUpdateVariables) =>
      updateFranchiseStatus(franchiseId, status),
    onSuccess: async (_data, { franchiseId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: franchiseKeys.detail(franchiseId) }),
        queryClient.invalidateQueries({ queryKey: [...franchiseKeys.all, 'list'] }),
      ])
    },
  })
}
