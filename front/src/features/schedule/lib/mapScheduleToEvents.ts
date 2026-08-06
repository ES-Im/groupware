import type { EventInput } from '@fullcalendar/core'
import type { ScheduleCalendarItem, ScheduleType } from '../model/schedule'

const SCHEDULE_TYPE_CLASSNAME: Record<ScheduleType, string> = {
  MANUAL: 'schedule-event-manual',
  MEETING: 'schedule-event-meeting',
  LEAVE: 'schedule-event-leave',
  BUSINESS_TRIP: 'schedule-event-trip',
}

export function mapScheduleToEvents(items: ScheduleCalendarItem[]): EventInput[] {
  return items.map((item) => {
    return {
      id: String(item.scheduleId),
      title: item.isCanceled ? `[취소] ${item.title}` : item.title,
      start: `${item.scheduleDate}T${item.startAt}`,
      end: `${item.scheduleDate}T${item.endAt}`,
      allDay: item.isAllDay,
      editable: false,
      classNames: [
        'schedule-event',
        SCHEDULE_TYPE_CLASSNAME[item.scheduleType],
        ...(item.isCanceled ? ['schedule-event-canceled'] : []),
      ],
      extendedProps: { scheduleType: item.scheduleType, isCanceled: item.isCanceled },
    }
  })
}
