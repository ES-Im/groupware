import { useMutation, useQueryClient } from '@tanstack/react-query'
import { franchiseKeys } from '../model/queryKeys'
import { assignInquiryAnswerManager } from './assignInquiryAnswerManager'

interface FranchiseInquiryAssignAnswerVariables {
  inquiryId: number
  assignedEmpId: number
}

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
