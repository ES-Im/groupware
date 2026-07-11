import type { EventInput } from '@fullcalendar/core'
import type { ScheduleCalendarItem, ScheduleType } from '../model/schedule'

/**
 * scheduleType별 FullCalendar backgroundColor(Tailwind blue/green/amber/purple-600 계열).
 */
const SCHEDULE_TYPE_COLOR: Record<ScheduleType, string> = {
  MANUAL: '#2563eb',
  MEETING: '#16a34a',
  LEAVE: '#d97706',
  BUSINESS_TRIP: '#9333ea',
}

/**
 * SCHEDULE_CALENDAR 응답 배열을 MeetingCalendar(FullCalendar 제네릭 래퍼)가 소비하는
 * EventInput[]으로 매핑한다. mapMeetingRoomReservationsToEvents.ts와 동일한 순수 매핑
 * 어댑터 패턴(부수효과 없음)을 따라, 뷰어 타임존과 무관하게 "회사 wall-clock" 시각을 그대로
 * 표시하기 위해 naive local datetime 문자열(yyyy-MM-ddTHH:mm:ss)을 그대로 조립한다(변환 없음).
 */
export function mapScheduleToEvents(items: ScheduleCalendarItem[]): EventInput[] {
  return items.map((item) => ({
    id: String(item.scheduleId),
    title: item.isCanceled ? `[취소] ${item.title}` : item.title,
    start: `${item.scheduleDate}T${item.startAt}`,
    end: `${item.scheduleDate}T${item.endAt}`,
    allDay: item.isAllDay,
    backgroundColor: SCHEDULE_TYPE_COLOR[item.scheduleType],
    classNames: item.isCanceled ? ['opacity-50'] : [],
    extendedProps: { scheduleType: item.scheduleType, isCanceled: item.isCanceled },
  }))
}
