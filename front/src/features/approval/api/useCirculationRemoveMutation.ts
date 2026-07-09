import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { handleApiError } from '@/shared/lib/apiError'
import { approvalKeys } from '../model/queryKeys'
import { removeCirculation } from './removeCirculation'

/**
 * 공람자 제거 mutation 훅(`DRAFT_CIRCULATION_REMOVE`, F708, ROADMAP(DRAFT) T5.1).
 *
 * 성공(204) 시 approvalKeys.all을 invalidate해 상세(공람자 목록)를 갱신하고 성공 토스트를 띄운다.
 * 실패(기안자 아님 등 서버 최종 판정)는 handleApiError로 정규화해 에러 토스트로 노출한다.
 * variables(`{draftId,empId}`)는 호출부가 공람자별 진행 상태(개별 disabled)를 추적하는 데 쓴다.
 */
export function useCirculationRemoveMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ draftId, empId }: { draftId: number; empId: number }) =>
      removeCirculation(draftId, empId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: approvalKeys.all })
      toast.success('공람자를 제거했습니다')
    },
    onError: (error) => {
      handleApiError(error, { toast })
    },
  })
}
