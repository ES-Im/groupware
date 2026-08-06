import { describe, expect, it } from 'vitest'
import { buildCalendarRangeParams } from './calendarRange'

describe('buildCalendarRangeParams', () => {
  it('activeStart/activeEnd를 YYYY-MM-DDTHH:mm:ss 포맷 문자열로 변환한다', () => {
    const activeStart = new Date(2026, 5, 1, 0, 0, 0)
    const activeEnd = new Date(2026, 6, 12, 0, 0, 0)

    expect(buildCalendarRangeParams(activeStart, activeEnd)).toEqual({
      start: '2026-06-01T00:00:00',
      end: '2026-07-12T00:00:00',
    })
  })

  it('인자를 하나도 전달하지 않으면 start/end 모두 undefined다', () => {
    expect(buildCalendarRangeParams()).toEqual({ start: undefined, end: undefined })
  })

  it('activeStart만 전달되면 start만 변환되고 end는 undefined다', () => {
    const activeStart = new Date(2026, 5, 1, 0, 0, 0)
    expect(buildCalendarRangeParams(activeStart)).toEqual({
      start: '2026-06-01T00:00:00',
      end: undefined,
    })
  })
})
