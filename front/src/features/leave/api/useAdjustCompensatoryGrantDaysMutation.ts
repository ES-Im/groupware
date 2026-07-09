import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { handleApiError } from '@/shared/lib/apiError'
import { leaveKeys } from '../model/leaveKeys'
import { adjustCompensatoryGrantDays } from './adjustCompensatoryGrantDays'

interface AdjustCompensatoryGrantDaysVariables {
  empId: number
  plusMinusDays: number
}

/**
 * 포상 휴가 부여일수 조정 mutation 훅(`EMP_LEAVE_ADJUST_COMPENSATORY_GRANT_DAYS`, ROADMAP(LEAVE)
 * M5 T5.2, F750). useAdjustSpecialGrantDaysMutation과 동형 — invalidate 범위·에러 처리 동일.
 */
export function useAdjustCompensatoryGrantDaysMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ empId, plusMinusDays }: AdjustCompensatoryGrantDaysVariables) =>
      adjustCompensatoryGrantDays(empId, plusMinusDays),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [...leaveKeys.all, 'emp'] })
      toast.success('포상 휴가 부여일수를 조정했습니다')
    },
    onError: (error) => {
      handleApiError(error, { toast })
    },
  })
}
