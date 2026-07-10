import { describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { updateMeetingReservationInfo } from './updateMeetingReservationInfo'

/**
 * updateMeetingReservationInfo(F804, ROADMAP T4.2) 단위 테스트.
 */
vi.mock('@/shared/api/client', () => ({
  apiClient: { patch: vi.fn().mockResolvedValue({ data: undefined }) },
}))

describe('updateMeetingReservationInfo', () => {
  it('PATCH /api/meetings/{meetingId}/reservation-info를 payload 그대로 호출한다', async () => {
    const payload = { title: '변경된 제목' }

    await updateMeetingReservationInfo(10, payload)

    expect(apiClient.patch).toHaveBeenCalledWith('/api/meetings/10/reservation-info', payload)
  })
})
