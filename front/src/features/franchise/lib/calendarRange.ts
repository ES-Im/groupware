import dayjs from 'dayjs'

/**
 * FullCalendar 뷰 range(datesSet 콜백의 view.activeStart/activeEnd)를 교육 캘린더(F1609) 서버
 * 쿼리 파라미터 start/end(yyyy-MM-dd'T'HH:mm:ss, start 포함·end 미포함)로 변환한다.
 * 인자 미전달 시 undefined를 반환해 서버가 당월 기본값(당월 1일 0시~익월 1일 0시)을 적용하도록
 * 위임한다(query-parameters.adoc 실측 — 프론트가 임의로 기본값을 강제하지 않음).
 *
 * meeting/lib/calendarRange.ts의 buildCalendarRangeParams와 동형 복제다 — 도메인 간 lib import를
 * 금지하는 컨벤션에 따라 franchise 전용 파일로 둔다.
 */
export type CalendarRangeParams = {
  start?: string
  end?: string
}

export function buildFranchiseCalendarRangeParams(
  activeStart?: Date,
  activeEnd?: Date,
): CalendarRangeParams {
  return {
    start: activeStart ? dayjs(activeStart).format('YYYY-MM-DDTHH:mm:ss') : undefined,
    end: activeEnd ? dayjs(activeEnd).format('YYYY-MM-DDTHH:mm:ss') : undefined,
  }
}
