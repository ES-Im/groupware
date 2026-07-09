import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { handleApiError } from '@/shared/lib/apiError'
import { approvalKeys } from '../model/queryKeys'
import { addCirculation } from './addCirculation'

/**
 * 공람자 추가 mutation 훅(`DRAFT_CIRCULATION_ADD`, F707, ROADMAP(DRAFT) T5.1).
 *
 * 성공(204) 시 approvalKeys.all을 invalidate해 상세(공람자 목록)를 갱신하고 성공 토스트를 띄운다.
 * 실패(빈 배열·기안자 아님 등 서버 최종 판정 위반)는 폼이 없어 setError 대상이 없으므로
 * handleApiError로 정규화한 메시지를 에러 토스트로 노출한다(승인 mutation과 동일 하우스 스타일).
 */
export function useCirculationAddMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ draftId, empIds }: { draftId: number; empIds: number[] }) =>
      addCirculation(draftId, empIds),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: approvalKeys.all })
      toast.success('공람자를 추가했습니다')
    },
    onError: (error) => {
      handleApiError(error, { toast })
    },
  })
}
