import { useMutation, useQueryClient } from '@tanstack/react-query'
import { franchiseKeys } from '../model/queryKeys'
import { clearFranchiseMemo } from './clearFranchiseMemo'

/**
 * 가맹점 메모 삭제 mutation 훅(`FRANCHISE_MEMO_CLEAR`, ROADMAP(FRANCHISE) T2.4-d, F1608).
 * 성공(204) 시 상세(`franchiseKeys.detail`)와 목록 접두사(`[...all, 'list']`)를 함께 invalidate
 * 한다(T2.4 mutation 4종 공통 invalidate 규약 — useFranchiseMemoUpdateMutation과 동일 근거).
 * 실패 시 에러는 그대로 던져 호출부가 handleApiError로 위임하도록 둔다.
 */
export function useFranchiseMemoClearMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (franchiseId: number) => clearFranchiseMemo(franchiseId),
    onSuccess: async (_data, franchiseId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: franchiseKeys.detail(franchiseId) }),
        queryClient.invalidateQueries({ queryKey: [...franchiseKeys.all, 'list'] }),
      ])
    },
  })
}
