import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { handleApiError } from '@/shared/lib/apiError'
import { approvalKeys } from '../model/queryKeys'
import { readCirculation } from './readCirculation'

/**
 * 공람 읽음 처리 mutation 훅(`DRAFT_CIRCULATION_READ`, F709, ROADMAP(DRAFT) T5.1).
 *
 * 다이얼로그/폼을 경유하지 않는 단발 버튼 액션이다 — draftId만으로 본인 공람을 읽음 처리한다.
 * 성공(204) 시 approvalKeys.all을 invalidate해 상세(공람자 readAt)를 갱신하고 성공 토스트를 띄운다.
 * 실패(이미 읽음·공람 대상 아님 등 서버 최종 판정)는 handleApiError로 정규화해 에러 토스트로 노출한다.
 */
export function useCirculationReadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (draftId: number) => readCirculation(draftId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: approvalKeys.all })
      toast.success('공람을 읽음 처리했습니다')
    },
    onError: (error) => {
      handleApiError(error, { toast })
    },
  })
}
