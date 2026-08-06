import dayjs from 'dayjs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MeetingReservationDetail } from '../model/meeting'
import { canManageReservation } from './canManageReservation'

function makeDetail(overrides: Partial<MeetingReservationDetail> = {}): MeetingReservationDetail {
  return {
    meetingId: 10,
    meetingRoomId: 3,
    meetingRoomName: '대회의실',
    reserverId: 7,
    reserverDeptName: '개발팀',
    reserverEmpName: '홍길동',
    title: '주간 회의',
    meetingDate: '2026-07-12',
    startAt: '10:00:00',
    endAt: '11:00:00',
    isCanceled: false,
    participantCount: 1,
    participants: [],
    ...overrides,
  }
}

describe('canManageReservation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-10T12:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('예약자 본인 + 취소되지 않음 + 회의일이 내일 이후면 true다', () => {
    expect(canManageReservation(makeDetail({ meetingDate: '2026-07-12' }), 7)).toBe(true)
  })

  it('myEmpId가 undefined이면 fail-closed로 false다', () => {
    expect(canManageReservation(makeDetail(), undefined)).toBe(false)
  })

  it('예약자 본인이 아니면 false다', () => {
    expect(canManageReservation(makeDetail({ reserverId: 999 }), 7)).toBe(false)
  })

  it('이미 취소된 예약이면 false다', () => {
    expect(canManageReservation(makeDetail({ isCanceled: true }), 7)).toBe(false)
  })

  it('회의일이 내일이 아니라 당일이면(수정 가능 기간 1일 전까지 규칙) false다', () => {
    expect(canManageReservation(makeDetail({ meetingDate: dayjs('2026-07-10').format('YYYY-MM-DD') }), 7)).toBe(
      false,
    )
  })

  it('회의일이 과거면 false다', () => {
    expect(canManageReservation(makeDetail({ meetingDate: '2026-07-01' }), 7)).toBe(false)
  })
})
