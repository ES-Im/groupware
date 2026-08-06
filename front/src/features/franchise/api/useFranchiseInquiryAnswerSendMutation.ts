import { useMutation, useQueryClient } from '@tanstack/react-query'
import { franchiseKeys } from '../model/queryKeys'
import { sendInquiryAnswer } from './sendInquiryAnswer'

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
