import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { handleApiError } from '@/shared/lib/apiError'
import { attendanceKeys } from '../model/queryKeys'
import { checkOut } from './checkOut'

export function useCheckOutMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: checkOut,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: attendanceKeys.all })
      toast.success('퇴근이 기록되었습니다')
    },
    onError: (error) => {
      handleApiError(error, { toast })
    },
  })
}
