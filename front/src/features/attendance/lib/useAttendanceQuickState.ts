import { useEffect } from 'react'
import dayjs from 'dayjs'
import { toast } from 'sonner'
import { handleApiError } from '@/shared/lib/apiError'
import { useCheckInMutation } from '../api/useCheckInMutation'
import { useCheckOutMutation } from '../api/useCheckOutMutation'
import { useMyAttendanceMonthlyQuery } from '../api/useMyAttendanceMonthlyQuery'
import { deriveHeaderAttendanceState } from './deriveHeaderAttendanceState'

/**
 * 헤더 프로필 드롭다운(HeaderAttendanceQuickPanel)과 좌측 고정 패널(RailAttendanceTiles)이
 * 공유하는 "오늘 출퇴근 상태 + 체크인/아웃" 훅. 두 소비처가 완전히 동일한 queryKey
 * (yearMonth/status/page/size)로 useMyAttendanceMonthlyQuery를 호출하므로 React Query 캐시를
 * 그대로 공유한다(둘 중 먼저 마운트되는 쪽이 실제 fetch를 트리거).
 */
export function useAttendanceQuickState() {
  const today = dayjs().format('YYYY-MM-DD')
  const currentYearMonth = dayjs().format('YYYY-MM')
  const todayAttendanceQuery = useMyAttendanceMonthlyQuery({
    yearMonth: currentYearMonth,
    status: undefined,
    page: 0,
    size: 100,
  })
  const checkInMutation = useCheckInMutation()
  const checkOutMutation = useCheckOutMutation()

  useEffect(() => {
    if (!todayAttendanceQuery.error) {
      return
    }
    handleApiError(todayAttendanceQuery.error, { toast })
  }, [todayAttendanceQuery.error])

  const { canCheckIn, canCheckOut, checkInTime, checkOutTime } = todayAttendanceQuery.isSuccess
    ? deriveHeaderAttendanceState(todayAttendanceQuery.data?.content ?? [], today)
    : { canCheckIn: false, canCheckOut: false, checkInTime: null, checkOutTime: null }

  return {
    canCheckIn,
    canCheckOut,
    checkInTime,
    checkOutTime,
    checkIn: () => checkInMutation.mutate(),
    checkOut: () => checkOutMutation.mutate(),
    isCheckInPending: checkInMutation.isPending,
    isCheckOutPending: checkOutMutation.isPending,
  }
}
