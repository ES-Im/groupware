import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { getAvailableMeetingRooms } from './getAvailableMeetingRooms'

vi.mock('@/shared/api/client', () => ({
  apiClient: { get: vi.fn().mockResolvedValue({ data: {} }) },
}))

describe('getAvailableMeetingRooms', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockClear()
  })

  it('필수 파라미터 4개만 있으면 page/size 없이 호출한다', async () => {
    await getAvailableMeetingRooms({ date: '2026-07-10', startAt: '10:00', endAt: '11:00', capacity: 4 })

    expect(apiClient.get).toHaveBeenCalledTimes(1)
    const [url, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(url).toBe('/api/meeting-rooms/available')
    expect(config?.params).toEqual({ date: '2026-07-10', startAt: '10:00', endAt: '11:00', capacity: 4 })
  })

  it('page/size를 지정하면 params에 함께 포함된다', async () => {
    await getAvailableMeetingRooms({
      date: '2026-07-10',
      startAt: '10:00',
      endAt: '11:00',
      capacity: 4,
      page: 1,
      size: 20,
    })

    const [, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(config?.params).toEqual({
      date: '2026-07-10',
      startAt: '10:00',
      endAt: '11:00',
      capacity: 4,
      page: 1,
      size: 20,
    })
  })

  it('응답을 그대로 반환한다', async () => {
    const page = {
      content: [{ meetingRoomId: 3, name: '대회의실', capacity: 10, isAvailable: true }],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 10,
      numberOfElements: 1,
      first: true,
      last: true,
      empty: false,
    }
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: page })

    const result = await getAvailableMeetingRooms({ date: '2026-07-10', startAt: '10:00', endAt: '11:00', capacity: 4 })

    expect(result).toEqual(page)
  })
})
