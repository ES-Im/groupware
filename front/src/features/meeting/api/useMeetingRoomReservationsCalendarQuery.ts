import { useQuery } from '@tanstack/react-query'
import { meetingKeys } from '../model/meetingKeys'
import type { CalendarRangeParams } from '../lib/calendarRange'
import { getMeetingRoomReservationsCalendar } from './getMeetingRoomReservationsCalendar'

/**
 * 회의실 예약 캘린더 조회 훅(ROADMAP T2.3, F809).
 * meetingRoomId 미확정 시 조회하지 않고 대기한다(roomDetail/roomFiles와 동일 이유).
 * range(FullCalendar 뷰 기간)가 바뀌면 queryKey(meetingKeys.roomReservationsCalendar)가
 * 달라져 자동으로 재조회된다.
 */
export function useMeetingRoomReservationsCalendarQuery(
  meetingRoomId: number | undefined,
  range?: CalendarRangeParams,
) {
  return useQuery({
    queryKey: meetingKeys.roomReservationsCalendar(meetingRoomId, range),
    queryFn: () => getMeetingRoomReservationsCalendar(meetingRoomId as number, range),
    enabled: meetingRoomId != null,
  })
}
