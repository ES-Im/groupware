import { useMutation, useQueryClient } from '@tanstack/react-query'
import { approvalKeys } from '../model/queryKeys'
import {
  createCancellationDraft,
  type CancellationDraftPayload,
  type CancellationDraftResult,
} from './createCancellationDraft'

/** useCancellationDraftMutation 호출 변수. submit=false 생성(임시저장) / true 생성+상신. */
interface CancellationDraftVariables {
  sourceDraftId: number
  payload: CancellationDraftPayload
  submit: boolean
}

/**
 * 취소 기안 생성/상신 mutation 훅(`DRAFT_CANCELLATION_CREATE(_SUBMISSION)`, F704, ROADMAP(DRAFT) T4.5).
 * 성공(201, `{draftId}`) 시 approvalKeys.all을 invalidate해 원본 상세(cancellationDraftId 링크)와
 * 상신함/임시저장함 목록을 최신화한 뒤, 반환된 draftId로 호출부(T4.5 다이얼로그)가 새 취소기안
 * 상세로 이동한다. 실패(기안자/상태 위반 등)는 에러를 그대로 던져 submitWithErrorMapping이
 * handleApiError로 위임하도록 둔다.
 */
export function useCancellationDraftMutation() {
  const queryClient = useQueryClient()

  return useMutation<CancellationDraftResult, unknown, CancellationDraftVariables>({
    mutationFn: ({ sourceDraftId, payload, submit }) =>
      createCancellationDraft(sourceDraftId, payload, submit),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: approvalKeys.all })
    },
  })
}
