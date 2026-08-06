import { useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { toast } from 'sonner'
import { handleApiError } from '@/shared/lib/apiError'
import { attendanceKeys } from '../model/queryKeys'
import { approveAttendance } from './approveAttendance'

interface ApproveAttendanceVariables {
  attendanceId: number
  targetEmpId: number
}

export function useApproveAttendanceMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ attendanceId, targetEmpId }: ApproveAttendanceVariables) =>
      approveAttendance(attendanceId, targetEmpId, dayjs().format('YYYY-MM-DDTHH:mm:ss')),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [...attendanceKeys.all, 'dept'] })
      toast.success('근태를 승인했습니다')
    },
    onError: (error) => {
      handleApiError(error, { toast })
    },
  })
}
