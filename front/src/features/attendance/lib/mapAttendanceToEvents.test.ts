import { describe, expect, it } from 'vitest'
import type { AttendanceItem } from '../model/attendance'
import { mapAttendanceToEvents } from './mapAttendanceToEvents'

/**
 * mapAttendanceToEvents(AttendanceItem[] → FullCalendar EventInput[]) 단위 테스트.
 *
 * 우측 AttendanceCalendar(F305 상세)의 이벤트 클릭이 근태 수정 다이얼로그(F307) 진입점이므로,
 * extendedProps 페이로드(targetEmpId/attendanceId/startAt/endAt/isApproved)의 정확성이 핵심이다
 * (DeptAttendancePage.handleCalendarEventClick이 이 값을 그대로 복원해 사용한다).
 */

function makeItem(overrides: Partial<AttendanceItem> = {}): AttendanceItem {
  return {
    attendanceId: 1,
    attendanceStatus: 'NORMAL',
    attendanceDate: '2026-07-01',
    startAt: '09:00:00',
    endAt: '18:00:00',
    isApproved: true,
    draftId: null,
    ...overrides,
  }
}

describe('mapAttendanceToEvents', () => {
  it('빈 배열이면 빈 배열을 반환한다', () => {
    expect(mapAttendanceToEvents([], 1)).toEqual([])
  })

  it('AttendanceItem을 id/title/start/allDay/classNames를 갖춘 EventInput으로 매핑한다', () => {
    const [event] = mapAttendanceToEvents([makeItem()], 1)

    expect(event.id).toBe('1')
    expect(event.title).toBe('정상')
    expect(event.start).toBe('2026-07-01')
    expect(event.allDay).toBe(true)
    expect(event.classNames).toEqual(['attendance-event', 'attendance-event-default'])
  })

  it('attendanceStatus별 variant 클래스명이 attendanceStatusBadgeMap과 일치한다(LATE_EARLY→destructive)', () => {
    const [event] = mapAttendanceToEvents([makeItem({ attendanceStatus: 'LATE_EARLY' })], 1)

    expect(event.title).toBe('지각/조퇴')
    expect(event.classNames).toEqual(['attendance-event', 'attendance-event-destructive'])
  })

  it('attendanceStatus가 null이면 "진행 중"/outline으로 매핑한다(getAttendanceStatusBadge null 가드)', () => {
    const [event] = mapAttendanceToEvents([makeItem({ attendanceStatus: null })], 1)

    expect(event.title).toBe('진행 중')
    expect(event.classNames).toEqual(['attendance-event', 'attendance-event-outline'])
  })

  it('extendedProps에 targetEmpId/attendanceId/startAt/endAt/isApproved를 정확히 싣는다', () => {
    const [event] = mapAttendanceToEvents(
      [makeItem({ attendanceId: 55, startAt: '10:00:00', endAt: null, isApproved: false })],
      42,
    )

    expect(event.extendedProps).toEqual({
      targetEmpId: 42,
      attendanceId: 55,
      startAt: '10:00:00',
      endAt: null,
      isApproved: false,
    })
  })

  it('여러 items를 각각 독립된 이벤트로 매핑한다', () => {
    const events = mapAttendanceToEvents(
      [makeItem({ attendanceId: 1 }), makeItem({ attendanceId: 2, attendanceDate: '2026-07-02' })],
      1,
    )

    expect(events).toHaveLength(2)
    expect(events[0].id).toBe('1')
    expect(events[1].id).toBe('2')
    expect(events[1].start).toBe('2026-07-02')
  })
})
