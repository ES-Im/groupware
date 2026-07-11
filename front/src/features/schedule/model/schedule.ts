/**
 * 일정 종류(도메인모델 §Schedule source_type Enum, SCHEDULE_CALENDAR query-parameters.adoc 실측).
 */
export type ScheduleType = 'MANUAL' | 'MEETING' | 'LEAVE' | 'BUSINESS_TRIP'

/**
 * 기간별 일정 캘린더 조회(`SCHEDULE_CALENDAR`, api-endpoint.md 기능ID `SCHEDULE_CALENDAR` →
 * `GET /api/schedules/calendar`) 응답 항목 타입.
 * 필드는 back/build/generated-snippets/SCHEDULE_CALENDAR/response-fields.adoc 실측 기준(추측 금지).
 */
export interface ScheduleCalendarItem {
  scheduleId: number
  scheduleType: ScheduleType
  title: string
  scheduleDate: string
  startAt: string
  endAt: string
  isAllDay: boolean
  isCanceled: boolean
}
