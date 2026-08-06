import { useMutation, useQueryClient } from '@tanstack/react-query'
import { franchiseKeys } from '../model/queryKeys'
import { createInquiryAnswer } from './createInquiryAnswer'

interface FranchiseInquiryAnswerCreateVariables {
  inquiryId: number
  answer: string
}

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
