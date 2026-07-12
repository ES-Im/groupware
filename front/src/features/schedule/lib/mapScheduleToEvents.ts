import type { EventInput } from '@fullcalendar/core'
import type { ScheduleCalendarItem, ScheduleType } from '../model/schedule'

/**
 * scheduleType별 FullCalendar 이벤트 클래스명. hex backgroundColor를 직접 박던 방식(구버전)을
 * 걷어내고, "옅은 배경 + 좌측 컬러 액센트 + 진한 텍스트" 스타일을 scheduleCalendar.css(스코프드)에서
 * 이 클래스로 정의한다 — 4개 뷰(월/주/일/목록) 전부에 일관 적용되며 다크모드도 CSS 변수로 따라온다.
 */
const SCHEDULE_TYPE_CLASSNAME: Record<ScheduleType, string> = {
  MANUAL: 'schedule-event-manual',
  MEETING: 'schedule-event-meeting',
  LEAVE: 'schedule-event-leave',
  BUSINESS_TRIP: 'schedule-event-trip',
}

/**
 * SCHEDULE_CALENDAR 응답 배열을 ScheduleCalendar(FullCalendar 래퍼)가 소비하는 EventInput[]으로
 * 매핑한다. 순수 매핑 어댑터(부수효과 없음)로, 뷰어 타임존과 무관하게 "회사 wall-clock" 시각을
 * 그대로 표시하기 위해 naive local datetime 문자열(yyyy-MM-ddTHH:mm:ss)을 그대로 조립한다(변환 없음).
 *
 * 드래그 가능 여부: 캘린더 리스트 응답에는 소유자 정보가 없어(ScheduleResponse에 ownerId/isEditable
 * 부재) 클라이언트는 `MANUAL && !isCanceled`인 이벤트만 잠정적으로 draggable(editable/startEditable)로
 * 표시하는 힌트만 준다 — 실제 소유자 판정은 서버가 하고, 실패 시 소비처(ScheduleCalendarPage)의
 * eventDrop 핸들러가 handleApiError 토스트 + info.revert()로 되돌린다. 이동만 허용하고 크기 조절은
 * 막기 위해 durationEditable은 false로 고정한다(eventResize 미지원).
 */
export function mapScheduleToEvents(items: ScheduleCalendarItem[]): EventInput[] {
  return items.map((item) => {
    const draggable = item.scheduleType === 'MANUAL' && !item.isCanceled
    return {
      id: String(item.scheduleId),
      title: item.isCanceled ? `[취소] ${item.title}` : item.title,
      start: `${item.scheduleDate}T${item.startAt}`,
      end: `${item.scheduleDate}T${item.endAt}`,
      allDay: item.isAllDay,
      editable: draggable,
      startEditable: draggable,
      durationEditable: false,
      classNames: [
        'schedule-event',
        SCHEDULE_TYPE_CLASSNAME[item.scheduleType],
        ...(item.isCanceled ? ['schedule-event-canceled'] : []),
      ],
      extendedProps: { scheduleType: item.scheduleType, isCanceled: item.isCanceled },
    }
  })
}
