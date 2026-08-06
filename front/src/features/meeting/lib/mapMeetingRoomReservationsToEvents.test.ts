import { describe, expect, it } from 'vitest'
import { mapMeetingRoomReservationsToEvents } from './mapMeetingRoomReservationsToEvents'

describe('mapMeetingRoomReservationsToEvents', () => {
  it('title/start/end와 함께 원본 항목을 extendedProps로 실어 클릭 시 예약 요약에 쓰게 한다', () => {
    const items = [
      {
        reserverDeptName: '개발팀',
        reserverEmpName: '홍길동',
        participantCount: 2,
        meetingDate: '2026-07-10',
        startAt: '10:00:00',
        endAt: '11:00:00',
      },
    ]

    const events = mapMeetingRoomReservationsToEvents(items)

    expect(events).toEqual([
      {
        title: '개발팀 · 홍길동 (참여자 2명)',
        start: '2026-07-10T10:00:00',
        end: '2026-07-10T11:00:00',
        extendedProps: {
          reserverDeptName: '개발팀',
          reserverEmpName: '홍길동',
          participantCount: 2,
          meetingDate: '2026-07-10',
          startAt: '10:00:00',
          endAt: '11:00:00',
        },
      },
    ])
  })

  it('id 필드를 부여하지 않는다(상세 링크 식별자 없음)', () => {
    const items = [
      {
        reserverDeptName: '개발팀',
        reserverEmpName: '홍길동',
        participantCount: 1,
        meetingDate: '2026-07-10',
        startAt: '10:00:00',
        endAt: '11:00:00',
      },
    ]

    const [event] = mapMeetingRoomReservationsToEvents(items)

    expect(event).not.toHaveProperty('id')
  })

  it('빈 배열이면 빈 배열을 반환한다', () => {
    expect(mapMeetingRoomReservationsToEvents([])).toEqual([])
  })
})
