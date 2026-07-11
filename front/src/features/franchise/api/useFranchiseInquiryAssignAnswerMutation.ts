import { useMutation, useQueryClient } from '@tanstack/react-query'
import { franchiseKeys } from '../model/queryKeys'
import { assignInquiryAnswerManager } from './assignInquiryAnswerManager'

/** useFranchiseInquiryAssignAnswerMutation 호출 변수. */
interface FranchiseInquiryAssignAnswerVariables {
  inquiryId: number
  assignedEmpId: number
}

/**
 * 답변 담당자 배정 mutation 훅(`FRANCHISE_INQUIRY_ASSIGN_ANSWER`, ROADMAP(FRANCHISE) T5.3, F1620).
 * 성공(204) 시 상세(`franchiseKeys.inquiry.detail`)와 목록 접두사(`[...all, 'inquiry', 'list']`)를
 * 함께 invalidate한다 — assignedManagerName은 목록(P6)에도 노출되고 assignedManagerId는 목록
 * 필터 축이기도 하다(useFranchiseManagerUpdateMutation과 동일 접두사 근거). 실패 시 에러는
 * 그대로 던져 호출부가 handleApiError로 위임하도록 둔다.
 */
export function useFranchiseInquiryAssignAnswerMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ inquiryId, assignedEmpId }: FranchiseInquiryAssignAnswerVariables) =>
      assignInquiryAnswerManager(inquiryId, assignedEmpId),
    onSuccess: async (_data, { inquiryId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: franchiseKeys.inquiry.detail(inquiryId) }),
        queryClient.invalidateQueries({ queryKey: [...franchiseKeys.all, 'inquiry', 'list'] }),
      ])
    },
  })
}
