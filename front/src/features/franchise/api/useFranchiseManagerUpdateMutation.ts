import { useMutation, useQueryClient } from '@tanstack/react-query'
import { franchiseKeys } from '../model/queryKeys'
import { updateFranchiseManager } from './updateFranchiseManager'

/** useFranchiseManagerUpdateMutation 호출 변수. */
interface FranchiseManagerUpdateVariables {
  franchiseId: number
  newManagerId: number
}

/**
 * 가맹점 담당자 변경 mutation 훅(`FRANCHISE_MANAGER_UPDATE`, ROADMAP(FRANCHISE) T2.4-c, F1606).
 * 성공(204) 시 상세(`franchiseKeys.detail`)와 목록 접두사(`[...all, 'list']`)를 함께 invalidate
 * 한다 — managerEmpName은 목록(P1)에도 노출되고 managerId는 목록 필터 축이기도 하다(T2.4-a
 * useFranchiseUpdateMutation과 동일 접두사 근거). 실패 시 에러는 그대로 던져 호출부가
 * handleApiError로 위임하도록 둔다.
 */
export function useFranchiseManagerUpdateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ franchiseId, newManagerId }: FranchiseManagerUpdateVariables) =>
      updateFranchiseManager(franchiseId, newManagerId),
    onSuccess: async (_data, { franchiseId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: franchiseKeys.detail(franchiseId) }),
        queryClient.invalidateQueries({ queryKey: [...franchiseKeys.all, 'list'] }),
      ])
    },
  })
}
