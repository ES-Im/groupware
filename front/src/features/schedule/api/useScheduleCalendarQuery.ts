import { useQuery } from '@tanstack/react-query'
import type { CalendarRangeParams } from '@/features/meeting/lib/calendarRange'
import { scheduleKeys } from '../model/scheduleKeys'
import { getScheduleCalendar } from './getScheduleCalendar'

/**
 * 기간별 일정 캘린더 조회 훅(ROADMAP(SCHEDULE) T1.2, F001).
 * params(캘린더 뷰 range·scheduleType)가 바뀌면 queryKey(scheduleKeys.calendar)가 달라져
 * 자동으로 재조회된다(월 이동 시 재조회 요구사항 충족).
 */
export function useScheduleCalendarQuery(params?: CalendarRangeParams & { scheduleType?: string }) {
  return useQuery({
    queryKey: scheduleKeys.calendar(params),
    queryFn: () => getScheduleCalendar(params),
  })
}
