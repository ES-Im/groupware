import { useMutation, useQueryClient } from '@tanstack/react-query'
import { franchiseKeys } from '../model/queryKeys'
import { updateInquiryAnswer } from './updateInquiryAnswer'

interface FranchiseInquiryAnswerUpdateVariables {
  inquiryId: number
  answer: string
}

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
