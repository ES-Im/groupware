import dayjs from 'dayjs'

/**
 * FullCalendar 뷰 range(datesSet 콜백의 view.activeStart/activeEnd)를 서버 쿼리 파라미터
 * start/end(yyyy-MM-dd'T'HH:mm:ss)로 변환한다. 인자 미전달 시 undefined를 반환해 서버가
 * 당월 기본값을 적용하도록 위임한다(쿼리 파라미터 전부 선택 — 프론트가 임의로 기본값을
 * 강제하지 않음, PRD §계약 실측 메모).
 */
export type CalendarRangeParams = {
  start?: string
  end?: string
}

export function buildCalendarRangeParams(activeStart?: Date, activeEnd?: Date): CalendarRangeParams {
  return {
    start: activeStart ? dayjs(activeStart).format('YYYY-MM-DDTHH:mm:ss') : undefined,
    end: activeEnd ? dayjs(activeEnd).format('YYYY-MM-DDTHH:mm:ss') : undefined,
  }
}
