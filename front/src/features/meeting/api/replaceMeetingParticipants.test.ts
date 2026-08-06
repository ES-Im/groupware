import { describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { replaceMeetingParticipants } from './replaceMeetingParticipants'

vi.mock('@/shared/api/client', () => ({
  apiClient: { patch: vi.fn().mockResolvedValue({ data: undefined }) },
}))

describe('replaceMeetingParticipants', () => {
  it('PATCH /api/meetings/{meetingId}/participants를 { participantIds }로 호출한다', async () => {
    await replaceMeetingParticipants(10, [101, 102])

    expect(apiClient.patch).toHaveBeenCalledWith('/api/meetings/10/participants', {
      participantIds: [101, 102],
    })
  })
})
