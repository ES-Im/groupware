/**
 * 일정 종류(도메인모델 §Schedule source_type Enum, SCHEDULE_CALENDAR query-parameters.adoc 실측).
 */
export type ScheduleType = 'MANUAL' | 'MEETING' | 'LEAVE' | 'BUSINESS_TRIP'

/**
 * 일정 유형 표시 순서(사이드바 필터·범례 렌더 순서). 캘린더 이벤트 색상 클래스 매핑과 유형 필터
 * 기본 선택 집합의 단일 출처로 삼아 페이지·사이드바·매핑 어댑터가 순서를 어긋나지 않게 공유한다.
 */
export const SCHEDULE_TYPES: ScheduleType[] = ['MANUAL', 'MEETING', 'LEAVE', 'BUSINESS_TRIP']

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
