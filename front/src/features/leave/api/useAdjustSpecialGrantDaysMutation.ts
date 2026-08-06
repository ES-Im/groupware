import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { handleApiError } from '@/shared/lib/apiError'
import { leaveKeys } from '../model/leaveKeys'
import { adjustSpecialGrantDays } from './adjustSpecialGrantDays'

interface AdjustSpecialGrantDaysVariables {
  empId: number
  plusMinusDays: number
}

export function useAdjustSpecialGrantDaysMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ empId, plusMinusDays }: AdjustSpecialGrantDaysVariables) =>
      adjustSpecialGrantDays(empId, plusMinusDays),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [...leaveKeys.all, 'emp'] })
      toast.success('특별 휴가 부여일수를 조정했습니다')
    },
    onError: (error) => {
      handleApiError(error, { toast })
    },
  })
}
