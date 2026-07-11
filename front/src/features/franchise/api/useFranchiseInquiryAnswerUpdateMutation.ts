import { useMutation, useQueryClient } from '@tanstack/react-query'
import { franchiseKeys } from '../model/queryKeys'
import { updateInquiryAnswer } from './updateInquiryAnswer'

/** useFranchiseInquiryAnswerUpdateMutation 호출 변수. */
interface FranchiseInquiryAnswerUpdateVariables {
  inquiryId: number
  answer: string
}

/**
 * 답변 초안 수정 mutation 훅(`FRANCHISE_INQUIRY_ANSWER_UPDATE`, ROADMAP(FRANCHISE) T5.4, F1622).
 * 성공(204) 시 답변·상세·목록 접두사를 함께 invalidate한다(useFranchiseInquiryAnswerCreateMutation과
 * 동일 근거). 실패는 그대로 던져 호출부가 submitWithErrorMapping으로 위임하도록 둔다.
 */
export function useFranchiseInquiryAnswerUpdateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ inquiryId, answer }: FranchiseInquiryAnswerUpdateVariables) =>
      updateInquiryAnswer(inquiryId, answer),
    onSuccess: async (_data, { inquiryId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: franchiseKeys.inquiry.answer(inquiryId) }),
        queryClient.invalidateQueries({ queryKey: franchiseKeys.inquiry.detail(inquiryId) }),
        queryClient.invalidateQueries({ queryKey: [...franchiseKeys.all, 'inquiry', 'list'] }),
      ])
    },
  })
}
