import { useMutation, useQueryClient } from '@tanstack/react-query'
import { approvalKeys } from '../model/queryKeys'
import {
  createGeneralDraft,
  type GeneralDraftPayload,
  type GeneralDraftResult,
} from './createGeneralDraft'

/** useGeneralDraftCreateMutation 호출 변수. submit=false 생성(임시저장) / true 생성+상신. */
interface GeneralDraftCreateVariables {
  payload: GeneralDraftPayload
  submit: boolean
}

/**
 * 일반 기안 생성/상신 mutation 훅(`GENERAL_DRAFT_CREATE(_SUBMISSION)`, F720, ROADMAP(DRAFT-COMMON) T1.2).
 * 성공(201, `{draftId}`) 시 approvalKeys.all을 invalidate해 상신함/임시저장함 목록을 최신화한 뒤,
 * 반환된 draftId로 호출부(작성 페이지)가 새 기안 상세로 이동한다. 실패는 에러를 그대로 던져
 * submitWithErrorMapping이 handleApiError로 위임하도록 둔다(useCancellationDraftMutation 동형).
 */
export function useGeneralDraftCreateMutation() {
  const queryClient = useQueryClient()

  return useMutation<GeneralDraftResult, unknown, GeneralDraftCreateVariables>({
    mutationFn: ({ payload, submit }) => createGeneralDraft(payload, submit),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: approvalKeys.all })
    },
  })
}
