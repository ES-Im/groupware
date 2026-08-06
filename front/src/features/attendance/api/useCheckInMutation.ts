import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { handleApiError } from '@/shared/lib/apiError'
import { attendanceKeys } from '../model/queryKeys'
import { checkIn } from './checkIn'

export function useCheckInMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: checkIn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: attendanceKeys.all })
      toast.success('출근이 기록되었습니다')
    },
    onError: (error) => {
      handleApiError(error, { toast })
    },
  })
}
