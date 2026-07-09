import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { handleApiError } from '@/shared/lib/apiError'
import { approvalKeys } from '../model/queryKeys'
import { updateBusinessTripParticipants } from './updateBusinessTripParticipants'

/** useBusinessTripParticipantsUpdateMutation 호출 변수. draftId 대상 기안 + 전량 교체할 참여자 empId 목록. */
interface BusinessTripParticipantsUpdateVariables {
  draftId: number
  participantIds: number[]
}

/**
 * 출장 참여자 전량 교체 mutation 훅(`BUSINESS_TRIP_PARTICIPANTS_UPDATE`, F732, ROADMAP(DRAFT-BUSINESSTRIP) T3.2).
 *
 * `useCirculationAddMutation`(①선례) 동형: 성공(204) 시 `approvalKeys.all`을 invalidate해 상세
 * (참여자 목록)를 갱신하고 성공 토스트를 띄운다. 실패(빈 배열·권한/상태 위반)는 handleApiError로
 * 정규화해 에러 토스트로 노출한다(다이얼로그에 별도 폼이 없어 setError 대상이 없음).
 */
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
