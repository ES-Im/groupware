import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { createMeetingRoom } from './createMeetingRoom'

vi.mock('@/shared/api/client', () => ({
  apiClient: { post: vi.fn() },
}))

describe('createMeetingRoom', () => {
  beforeEach(() => {
    vi.mocked(apiClient.post).mockClear()
  })

  it('/api/meeting-rooms로 payload를 그대로 POST하고 응답의 meetingRoomId를 반환한다', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { meetingRoomId: 10 } })

    const payload = { name: '대회의실', description: '층별 대형 회의실', capacity: 12 }
    const result = await createMeetingRoom(payload)

    expect(apiClient.post).toHaveBeenCalledTimes(1)
    const [url, body] = vi.mocked(apiClient.post).mock.calls[0]
    expect(url).toBe('/api/meeting-rooms')
    expect(body).toEqual(payload)
    expect(result).toEqual({ meetingRoomId: 10 })
  })

  it('서버 판정 실패는 삼켜지지 않고 그대로 throw된다', async () => {
    vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('request failed'))

    await expect(
      createMeetingRoom({ name: '대회의실', description: '설명', capacity: 5 }),
    ).rejects.toThrow('request failed')
  })
})
