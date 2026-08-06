import type { EventClickArg, EventInput } from '@fullcalendar/core'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MeetingCalendar } from './MeetingCalendar'

describe('MeetingCalendar', () => {
  it('항상 마운트되어 FullCalendar 표준 DOM(테이블 뷰)이 렌더된다', () => {
    render(<MeetingCalendar events={[]} onRangeChange={vi.fn()} />)

    expect(document.querySelector('.fc')).toBeInTheDocument()
  })

  it('events prop이 바뀌어도 FullCalendar 루트 DOM 노드가 리마운트되지 않는다', () => {
    const { rerender } = render(<MeetingCalendar events={[]} onRangeChange={vi.fn()} />)
    const rootBefore = document.querySelector('.fc')
    expect(rootBefore).not.toBeNull()

    const events: EventInput[] = [{ id: '1', title: '주간 회의', start: '2026-07-10', end: '2026-07-10' }]
    rerender(<MeetingCalendar events={events} onRangeChange={vi.fn()} />)

    const rootAfter = document.querySelector('.fc')
    expect(rootAfter).toBe(rootBefore)
  })

  it('onRangeChange/onEventClick 핸들러 참조가 바뀌어도 리마운트되지 않는다', () => {
    const { rerender } = render(<MeetingCalendar events={[]} onRangeChange={vi.fn()} onEventClick={vi.fn()} />)
    const rootBefore = document.querySelector('.fc')

    rerender(<MeetingCalendar events={[]} onRangeChange={vi.fn()} onEventClick={vi.fn()} />)

    expect(document.querySelector('.fc')).toBe(rootBefore)
  })

  it('이벤트 클릭 시 onEventClick이 EventClickArg와 함께 호출된다', async () => {
    const handleEventClick = vi.fn()
    const events: EventInput[] = [{ id: '1', title: '주간 회의', start: '2026-07-10', end: '2026-07-11' }]
    render(<MeetingCalendar events={events} onRangeChange={vi.fn()} onEventClick={handleEventClick} />)

    const eventEl = await screen.findByText('주간 회의')
    eventEl.click()

    expect(handleEventClick).toHaveBeenCalledTimes(1)
    const arg = handleEventClick.mock.calls[0][0] as EventClickArg
    expect(arg.event.id).toBe('1')
  })
})
