import { describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { cancelMeetingReservation } from './cancelMeetingReservation'

/**
 * cancelMeetingReservation(F806, ROADMAP T4.2) 단위 테스트.
 */
vi.mock('@/shared/api/client', () => ({
  apiClient: { patch: vi.fn().mockResolvedValue({ data: undefined }) },
}))

describe('cancelMeetingReservation', () => {
  it('PATCH /api/meetings/{meetingId}/cancel을 요청 본문 없이 호출한다', async () => {
    await cancelMeetingReservation(10)

    expect(apiClient.patch).toHaveBeenCalledWith('/api/meetings/10/cancel')
  })
})
