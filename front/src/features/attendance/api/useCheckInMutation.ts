import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { handleApiError } from '@/shared/lib/apiError'
import { attendanceKeys } from '../model/queryKeys'
import { checkIn } from './checkIn'

/**
 * 출근 체크인 mutation 훅(`MY_ATTENDANCE_CHECK_IN`, ROADMAP T2.2, F301).
 *
 * 폼 없는 단일 버튼 액션(T2.3에서 소비)이라 board/department 도메인처럼 toast를 호출부에
 * 위임하지 않고, ROADMAP T2.2 명세대로 훅 자체가 성공/실패 토스트를 직접 담당한다 — 호출부마다
 * 반복될 동일 토스트 문구를 이 훅 하나로 표준화한다.
 *
 * 성공(204) 시 attendanceKeys.all을 invalidate해 월별 목록(T1.4 useMyAttendanceMonthlyQuery)·
 * 요약(useMyAttendanceMonthlySummaryQuery)이 최신 출근 기록을 반영하도록 하고 성공 토스트를 띄운다.
 * 실패(예: 중복 출근) 시 handleApiError(T0.2c)로 정규화한 메시지를 에러 토스트로 노출한다.
 */
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
