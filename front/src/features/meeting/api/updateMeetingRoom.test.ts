import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { updateMeetingRoom } from './updateMeetingRoom'

vi.mock('@/shared/api/client', () => ({
  apiClient: { patch: vi.fn().mockResolvedValue({ data: undefined }) },
}))

describe('updateMeetingRoom', () => {
  beforeEach(() => {
    vi.mocked(apiClient.patch).mockClear()
  })

  it('/api/meeting-rooms/{id}로 payload를 그대로 PATCH한다(전 필드)', async () => {
    await updateMeetingRoom(3, { name: '대회의실', description: '수정된 설명', capacity: 20 })

    expect(apiClient.patch).toHaveBeenCalledTimes(1)
    const [url, body] = vi.mocked(apiClient.patch).mock.calls[0]
    expect(url).toBe('/api/meeting-rooms/3')
    expect(body).toEqual({ name: '대회의실', description: '수정된 설명', capacity: 20 })
  })

  it('일부 필드만 담아도(부분수정) 그대로 전달되고 나머지 키는 payload에 없다', async () => {
    await updateMeetingRoom(3, { capacity: 15 })

    const [, body] = vi.mocked(apiClient.patch).mock.calls[0]
    expect(body).toEqual({ capacity: 15 })
    expect(body).not.toHaveProperty('name')
    expect(body).not.toHaveProperty('description')
  })

  it('서버 판정 실패(변경값 없음 등)는 삼켜지지 않고 그대로 throw된다', async () => {
    vi.mocked(apiClient.patch).mockRejectedValueOnce(new Error('request failed'))

    await expect(updateMeetingRoom(3, {})).rejects.toThrow('request failed')
  })
})
