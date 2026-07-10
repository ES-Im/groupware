import { describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { getMeetingRoomDetail } from './getMeetingRoomDetail'

/**
 * getMeetingRoomDetail(F807, ROADMAP T2.1) 단위 테스트.
 * apiClient.get 직접 모킹으로 URL/응답 그대로 반환 여부만 검증한다.
 */
vi.mock('@/shared/api/client', () => ({
  apiClient: { get: vi.fn() },
}))

describe('getMeetingRoomDetail', () => {
  it('GET /api/meeting-rooms/{meetingRoomId}를 호출한다', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: { meetingRoomId: 3, name: '대회의실', description: '설명', capacity: 10, isAvailable: true },
    })

    await getMeetingRoomDetail(3)

    expect(apiClient.get).toHaveBeenCalledWith('/api/meeting-rooms/3')
  })

  it('응답을 그대로 반환한다(파싱 가공 없음)', async () => {
    const detail = { meetingRoomId: 3, name: '대회의실', description: '설명', capacity: 10, isAvailable: true }
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: detail })

    const result = await getMeetingRoomDetail(3)

    expect(result).toEqual(detail)
  })
})
