import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { handleApiError } from '@/shared/lib/apiError'
import { approvalKeys } from '../model/queryKeys'
import { updateBusinessTripParticipants } from './updateBusinessTripParticipants'

interface BusinessTripParticipantsUpdateVariables {
  draftId: number
  participantIds: number[]
}

export function useBusinessTripParticipantsUpdateMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, unknown, BusinessTripParticipantsUpdateVariables>({
    mutationFn: ({ draftId, participantIds }) =>
      updateBusinessTripParticipants(draftId, participantIds),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: approvalKeys.all })
      toast.success('참여자를 수정했습니다')
    },
    onError: (error) => {
      handleApiError(error, { toast })
    },
  })
}
