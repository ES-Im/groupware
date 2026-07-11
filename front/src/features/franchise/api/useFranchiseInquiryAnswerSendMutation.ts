import { useMutation, useQueryClient } from '@tanstack/react-query'
import { franchiseKeys } from '../model/queryKeys'
import { sendInquiryAnswer } from './sendInquiryAnswer'

/**
 * 답변 발송 mutation 훅(`FRANCHISE_INQUIRY_ANSWER_SEND`, ROADMAP(FRANCHISE) T5.4, F1623).
 * 성공(204) 시 답변·상세·목록 접두사를 invalidate한다(생성/수정 mutation과 동일 근거 —
 * isSubmitted 전환이 답변 조회는 물론 목록의 isAnswered 표시에도 영향을 준다).
 */
export function useFranchiseInquiryAnswerSendMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (inquiryId: number) => sendInquiryAnswer(inquiryId),
    onSuccess: async (_data, inquiryId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: franchiseKeys.inquiry.answer(inquiryId) }),
        queryClient.invalidateQueries({ queryKey: franchiseKeys.inquiry.detail(inquiryId) }),
        queryClient.invalidateQueries({ queryKey: [...franchiseKeys.all, 'inquiry', 'list'] }),
      ])
    },
  })
}
