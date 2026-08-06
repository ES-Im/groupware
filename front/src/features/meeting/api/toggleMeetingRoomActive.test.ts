import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { activateMeetingRoom, deactivateMeetingRoom } from './toggleMeetingRoomActive'

vi.mock('@/shared/api/client', () => ({
  apiClient: { patch: vi.fn().mockResolvedValue({ data: undefined }) },
}))

describe('activateMeetingRoom / deactivateMeetingRoom', () => {
  beforeEach(() => {
    vi.mocked(apiClient.patch).mockClear()
  })

  it('activateMeetingRoom은 /api/meeting-rooms/{id}/activate로 PATCH하고 본문 없이 호출한다', async () => {
    await activateMeetingRoom(5)

    expect(apiClient.patch).toHaveBeenCalledTimes(1)
    const [url, body] = vi.mocked(apiClient.patch).mock.calls[0]
    expect(url).toBe('/api/meeting-rooms/5/activate')
    expect(body).toBeUndefined()
  })

  it('deactivateMeetingRoom은 /api/meeting-rooms/{id}/deactivate로 PATCH하고 본문 없이 호출한다', async () => {
    await deactivateMeetingRoom(7)

    expect(apiClient.patch).toHaveBeenCalledTimes(1)
    const [url, body] = vi.mocked(apiClient.patch).mock.calls[0]
    expect(url).toBe('/api/meeting-rooms/7/deactivate')
    expect(body).toBeUndefined()
  })
})
