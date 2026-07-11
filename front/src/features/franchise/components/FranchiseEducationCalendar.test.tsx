import type { EventClickArg, EventInput } from '@fullcalendar/core'
import { render, screen } from '@testing-library/react'
import dayjs from 'dayjs'
import { describe, expect, it, vi } from 'vitest'
import { FranchiseEducationCalendar } from './FranchiseEducationCalendar'

/**
 * FranchiseEducationCalendar(ROADMAP(FRANCHISE) T4.1, MeetingCalendar 동형 래퍼) 테스트.
 * MeetingCalendar.test.tsx 패턴 복제.
 *
 * - 항상 마운트된다(FullCalendar 표준 DOM 구조가 렌더된다).
 * - events/핸들러 props가 바뀌어도 리마운트되지 않는다(불변식) — FullCalendar 루트 DOM 노드의
 *   동일성(참조)으로 확인한다. 리마운트되면 datesSet이 다시 불려 range가 리셋되고, 사용자가
 *   이동해 둔 뷰(월)가 초기화되는 회귀가 생긴다.
 *
 * 이벤트 날짜는 오늘로 고정한다 — FullCalendar 초기 뷰(dayGridMonth)가 현재월을 보여주므로
 * 다른 달로 고정하면 초기 뷰에 렌더되지 않아 findByText가 타임아웃난다(선례 주석 동일).
 */
const today = dayjs().format('YYYY-MM-DD')

describe('FranchiseEducationCalendar', () => {
  it('항상 마운트되어 FullCalendar 표준 DOM(테이블 뷰)이 렌더된다', () => {
    render(<FranchiseEducationCalendar events={[]} onRangeChange={vi.fn()} />)

    expect(document.querySelector('.fc')).toBeInTheDocument()
  })

  it('events prop이 바뀌어도 FullCalendar 루트 DOM 노드가 리마운트되지 않는다', () => {
    const { rerender } = render(<FranchiseEducationCalendar events={[]} onRangeChange={vi.fn()} />)
    const rootBefore = document.querySelector('.fc')
    expect(rootBefore).not.toBeNull()

    const events: EventInput[] = [{ id: '1', title: '위생 교육 · 교육장', start: today }]
    rerender(<FranchiseEducationCalendar events={events} onRangeChange={vi.fn()} />)

    const rootAfter = document.querySelector('.fc')
    expect(rootAfter).toBe(rootBefore)
  })

  it('onRangeChange/onEventClick 핸들러 참조가 바뀌어도 리마운트되지 않는다', () => {
    const { rerender } = render(
      <FranchiseEducationCalendar events={[]} onRangeChange={vi.fn()} onEventClick={vi.fn()} />,
    )
    const rootBefore = document.querySelector('.fc')

    rerender(
      <FranchiseEducationCalendar events={[]} onRangeChange={vi.fn()} onEventClick={vi.fn()} />,
    )

    expect(document.querySelector('.fc')).toBe(rootBefore)
  })

  it('이벤트 클릭 시 onEventClick이 EventClickArg와 함께 호출된다', async () => {
    const handleEventClick = vi.fn()
    const events: EventInput[] = [{ id: '1', title: '위생 교육 · 교육장', start: today }]
    render(
      <FranchiseEducationCalendar
        events={events}
        onRangeChange={vi.fn()}
        onEventClick={handleEventClick}
      />,
    )

    const eventEl = await screen.findByText('위생 교육 · 교육장')
    eventEl.click()

    expect(handleEventClick).toHaveBeenCalledTimes(1)
    const arg = handleEventClick.mock.calls[0][0] as EventClickArg
    expect(arg.event.id).toBe('1')
  })
})
