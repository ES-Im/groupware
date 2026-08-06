import dayjs from 'dayjs'
import { describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { createMeetingReservation, formatMeetingTimeOfDay } from './createMeetingReservation'

vi.mock('@/shared/api/client', () => ({
  apiClient: { post: vi.fn().mockResolvedValue({ data: undefined }) },
}))

describe('createMeetingReservation', () => {
  it('POST /api/meetings를 payload 그대로 호출한다', async () => {
    const payload = {
      meetingRoomId: 3,
      reserverId: 7,
      title: '주간 회의',
      meetingDate: '2026-07-10',
      startAt: '10:00',
      endAt: '11:00',
      participantIds: [101, 102],
    }

    await createMeetingReservation(payload)

    expect(apiClient.post).toHaveBeenCalledWith('/api/meetings', payload)
  })
})

describe('formatMeetingTimeOfDay', () => {
  it('Date를 HH:mm 포맷 문자열로 변환한다(request-fields.adoc 실측: HH:mm 전송)', () => {
    const value = dayjs('2026-07-10T09:05:00').toDate()

    expect(formatMeetingTimeOfDay(value)).toBe('09:05')
  })
})
