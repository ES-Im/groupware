import { useMutation, useQueryClient } from '@tanstack/react-query'
import { franchiseKeys } from '../model/queryKeys'
import { createInquiryAnswer } from './createInquiryAnswer'

/** useFranchiseInquiryAnswerCreateMutation 호출 변수. */
interface FranchiseInquiryAnswerCreateVariables {
  inquiryId: number
  answer: string
}

/**
 * 답변 초안 생성 mutation 훅(`FRANCHISE_INQUIRY_ANSWER_CREATE`, ROADMAP(FRANCHISE) T5.4, F1621).
 * 성공(201) 시 답변(`franchiseKeys.inquiry.answer`)·상세(`franchiseKeys.inquiry.detail`)·목록
 * 접두사(`[...all,'inquiry','list']`)를 함께 invalidate한다 — isAnswered는 목록(P6)의 필터 축이자
 * 표시 컬럼이기도 하다. 실패는 그대로 던져 호출부가 submitWithErrorMapping으로 위임하도록 둔다.
 */
export function useFranchiseInquiryAnswerCreateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ inquiryId, answer }: FranchiseInquiryAnswerCreateVariables) =>
      createInquiryAnswer(inquiryId, answer),
    onSuccess: async (_data, { inquiryId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: franchiseKeys.inquiry.answer(inquiryId) }),
        queryClient.invalidateQueries({ queryKey: franchiseKeys.inquiry.detail(inquiryId) }),
        queryClient.invalidateQueries({ queryKey: [...franchiseKeys.all, 'inquiry', 'list'] }),
      ])
    },
  })
}
