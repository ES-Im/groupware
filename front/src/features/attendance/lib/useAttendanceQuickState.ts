import { useEffect } from 'react'
import dayjs from 'dayjs'
import { toast } from 'sonner'
import { handleApiError } from '@/shared/lib/apiError'
import { useCheckInMutation } from '../api/useCheckInMutation'
import { useCheckOutMutation } from '../api/useCheckOutMutation'
import { useMyAttendanceMonthlyQuery } from '../api/useMyAttendanceMonthlyQuery'
import { deriveHeaderAttendanceState } from './deriveHeaderAttendanceState'

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
