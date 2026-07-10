import { useQuery } from '@tanstack/react-query'
import { meetingKeys } from '../model/meetingKeys'
import type { CalendarRangeParams } from '../lib/calendarRange'
import { getMyMeetingReservationsCalendar } from './getMyMeetingReservationsCalendar'

/**
 * 내 회의 예약 캘린더 조회 훅(ROADMAP T1.3, F800).
 * range(FullCalendar 뷰 기간)가 바뀌면 queryKey(meetingKeys.myReservationsCalendar(range))가
 * 달라져 자동으로 재조회된다. 실패는 throw로 위임하고 handleApiError는 소비 페이지가 처리한다.
 */
export function useMyMeetingReservationsCalendarQuery(range?: CalendarRangeParams) {
  return useQuery({
    queryKey: meetingKeys.myReservationsCalendar(range),
    queryFn: () => getMyMeetingReservationsCalendar(range),
  })
}
