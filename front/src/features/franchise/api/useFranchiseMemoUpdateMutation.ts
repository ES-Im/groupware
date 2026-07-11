import { useMutation, useQueryClient } from '@tanstack/react-query'
import { franchiseKeys } from '../model/queryKeys'
import { updateFranchiseMemo } from './updateFranchiseMemo'

/** useFranchiseMemoUpdateMutation 호출 변수. */
interface FranchiseMemoUpdateVariables {
  franchiseId: number
  memo: string
}

/**
 * 가맹점 메모 수정 mutation 훅(`FRANCHISE_MEMO_UPDATE`, ROADMAP(FRANCHISE) T2.4-d, F1607).
 * 성공(204) 시 상세(`franchiseKeys.detail`)와 목록 접두사(`[...all, 'list']`)를 함께 invalidate
 * 한다 — 메모는 목록에 노출되지 않지만 T2.4 mutation 4종의 공통 invalidate 규약을 맞춘다
 * (T2.4-a useFranchiseUpdateMutation과 동형). 실패 시 에러는 그대로 던져 호출부가
 * handleApiError로 위임하도록 둔다.
 */
export function useFranchiseMemoUpdateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ franchiseId, memo }: FranchiseMemoUpdateVariables) =>
      updateFranchiseMemo(franchiseId, memo),
    onSuccess: async (_data, { franchiseId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: franchiseKeys.detail(franchiseId) }),
        queryClient.invalidateQueries({ queryKey: [...franchiseKeys.all, 'list'] }),
      ])
    },
  })
}
