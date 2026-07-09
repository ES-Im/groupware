import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { handleApiError } from '@/shared/lib/apiError'
import { approvalKeys } from '../model/queryKeys'
import { approveDraft } from './approveDraft'

/**
 * 기안서 승인 mutation 훅(`DRAFT_APPROVE`, F705, ROADMAP(DRAFT) T3.2).
 *
 * 다이얼로그/폼을 경유하지 않는 단발 버튼 클릭 액션이다 — draftId만으로 승인한다.
 * 성공(204) 시 approvalKeys.all을 invalidate해 상세(approvers 타임라인·상태 배지)·문서함 4종·
 * 결재대기 뱃지(F711)를 일괄 갱신하고 성공 토스트를 띄운다. 실패(차례 아님·이미 처리·결재선 밖 등
 * 서버 최종 판정 위반)는 폼이 없어 setError 대상이 없으므로 handleApiError로 정규화한 메시지를
 * 에러 토스트로 노출한다(반려 mutation과 달리 onError를 여기서 처리 — 호출부는 mutate만 한다).
 */
export function useApproveDraftMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (draftId: number) => approveDraft(draftId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: approvalKeys.all })
      toast.success('기안서를 승인했습니다')
    },
    onError: (error) => {
      handleApiError(error, { toast })
    },
  })
}
