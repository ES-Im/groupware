import { describe, expect, it } from 'vitest'
import { buildFranchiseCalendarRangeParams } from './calendarRange'

/**
 * buildFranchiseCalendarRangeParams(ROADMAP(FRANCHISE) T4.1) 단위 테스트.
 * meeting/lib/calendarRange.test.ts(buildCalendarRangeParams)와 동형 복제.
 *
 * FullCalendar의 view.activeStart/activeEnd(Date)를 교육 캘린더(F1609) 서버 쿼리 파라미터
 * 포맷(yyyy-MM-dd'T'HH:mm:ss)으로 변환한다. 인자 미전달 시 undefined를 반환해 서버가
 * 당월 기본값을 적용하도록 위임한다.
 */
describe('buildFranchiseCalendarRangeParams', () => {
  it('activeStart/activeEnd를 YYYY-MM-DDTHH:mm:ss 포맷 문자열로 변환한다', () => {
    const activeStart = new Date(2026, 5, 1, 0, 0, 0)
    const activeEnd = new Date(2026, 6, 12, 0, 0, 0)

    expect(buildFranchiseCalendarRangeParams(activeStart, activeEnd)).toEqual({
      start: '2026-06-01T00:00:00',
      end: '2026-07-12T00:00:00',
    })
  })

  it('인자를 하나도 전달하지 않으면 start/end 모두 undefined다', () => {
    expect(buildFranchiseCalendarRangeParams()).toEqual({ start: undefined, end: undefined })
  })

  it('activeStart만 전달되면 start만 변환되고 end는 undefined다', () => {
    const activeStart = new Date(2026, 5, 1, 0, 0, 0)
    expect(buildFranchiseCalendarRangeParams(activeStart)).toEqual({
      start: '2026-06-01T00:00:00',
      end: undefined,
    })
  })
})
