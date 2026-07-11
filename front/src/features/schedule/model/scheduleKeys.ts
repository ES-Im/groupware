import type { CalendarRangeParams } from '@/features/meeting/lib/calendarRange'

/**
 * schedule 도메인 queryKey 팩토리(ROADMAP(SCHEDULE) T1.1 / §참조 계약 매핑).
 * meetingKeys.ts(@/features/meeting/model/meetingKeys)와 동형 구조 — all을 배열 리터럴로
 * 고정해 invalidateQueries(scheduleKeys.all)로 하위 전체를 한 번에 갱신할 수 있게 한다.
 *
 * calendar(params)는 T1.2(SCHEDULE_CALENDAR)에서, detail(scheduleId)는 T2.1(SCHEDULE_DETAIL)에서
 * 실제로 소비된다. 이 태스크(T1.1)는 시그니처만 먼저 고정한다(meetingKeys.roomDetail 선례와 동일 이유).
 *
 * calendar의 params는 calendarRange.ts의 buildCalendarRangeParams 반환 타입(CalendarRangeParams)을
 * 그대로 재사용해 캘린더 유틸과 queryKey 파라미터 타입이 어긋나지 않게 한다.
 */
export const scheduleKeys = {
  all: ['schedule'] as const,
  // params 미지정 시 3칸(['schedule','calendar',undefined])이 아니라 2칸 프리픽스를 반환한다 —
  // invalidateQueries({queryKey: scheduleKeys.calendar()})가 구체 params를 가진 실제 캐시 쿼리와
  // partialMatchKey로 매칭되게 하기 위함(3칸 undefined는 타입이 달라 매칭 실패, T6.1 리뷰로 확인됨).
  calendar: (params?: CalendarRangeParams & { scheduleType?: string }) =>
    params === undefined
      ? ([...scheduleKeys.all, 'calendar'] as const)
      : ([...scheduleKeys.all, 'calendar', params] as const),
  detail: (scheduleId: number | undefined) => [...scheduleKeys.all, 'detail', scheduleId] as const,
}
