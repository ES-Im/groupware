import dayjs from 'dayjs'
import type { MeetingReservationDetail } from '../model/meeting'

export function canManageReservation(
  detail: MeetingReservationDetail,
  myEmpId: number | undefined,
): boolean {
  if (myEmpId === undefined) {
    return false
  }
  return (
    detail.reserverId === myEmpId &&
    !detail.isCanceled &&
    dayjs(detail.meetingDate).isAfter(dayjs(), 'day')
  )
}
