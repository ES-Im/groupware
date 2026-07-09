import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { handleApiError } from '@/shared/lib/apiError'
import { attendanceKeys } from '../model/queryKeys'
import { checkOut } from './checkOut'

/**
 * 퇴근 체크아웃 mutation 훅(`MY_ATTENDANCE_CHECK_OUT`, ROADMAP T2.2, F302).
 *
 * useCheckInMutation과 동일 이유로(폼 없는 단일 버튼 액션, T2.3에서 소비) 훅 자체가 성공/실패
 * 토스트를 직접 담당한다.
 *
 * 성공(204) 시 attendanceKeys.all을 invalidate해 월별 목록(T1.4 useMyAttendanceMonthlyQuery)·
 * 요약(useMyAttendanceMonthlySummaryQuery)이 최신 퇴근 기록을 반영하도록 하고 성공 토스트를 띄운다.
 * 실패(예: 출근 기록 없이 퇴근 시도) 시 handleApiError(T0.2c)로 정규화한 메시지를 에러 토스트로 노출한다.
 */
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
