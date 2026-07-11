import { apiClient } from '@/shared/api/client'
import type { CalendarRangeParams } from '@/features/meeting/lib/calendarRange'
import type { ScheduleCalendarItem } from '../model/schedule'

/**
 * 기간별 일정 캘린더 조회(`SCHEDULE_CALENDAR`, api-endpoint.md 기능ID `SCHEDULE_CALENDAR` →
 * `GET /api/schedules/calendar`, 권한 EMPLOYEE(조회 가능 범위)).
 * start/end/scheduleType 전부 선택 쿼리 — 미입력 시 서버가 조회 기준 월 범위로 기본값을 적용한다.
 */
export async function getScheduleCalendar(
  params?: CalendarRangeParams & { scheduleType?: string },
): Promise<ScheduleCalendarItem[]> {
  const { data } = await apiClient.get<ScheduleCalendarItem[]>('/api/schedules/calendar', { params })
  return data
}
