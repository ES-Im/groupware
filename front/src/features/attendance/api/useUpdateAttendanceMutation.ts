import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { handleApiError } from '@/shared/lib/apiError'
import { attendanceKeys } from '../model/queryKeys'
import { updateAttendance, type UpdateAttendanceRequest } from './updateAttendance'

interface UpdateAttendanceVariables {
  attendanceId: number
  payload: UpdateAttendanceRequest
}

export function useUpdateAttendanceMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ attendanceId, payload }: UpdateAttendanceVariables) =>
      updateAttendance(attendanceId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [...attendanceKeys.all, 'dept'] })
      toast.success('근태 정보를 수정했습니다')
    },
    onError: (error) => {
      handleApiError(error, { toast })
    },
  })
}
