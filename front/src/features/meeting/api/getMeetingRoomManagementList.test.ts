import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { getMeetingRoomManagementList } from './getMeetingRoomManagementList'

vi.mock('@/shared/api/client', () => ({
  apiClient: { get: vi.fn().mockResolvedValue({ data: undefined }) },
}))

describe('getMeetingRoomManagementList', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockClear()
  })

  it('파라미터를 하나도 주지 않으면 /api/meeting-rooms/management로 요청하고 params 객체가 빈 객체다', async () => {
    await getMeetingRoomManagementList()

    expect(apiClient.get).toHaveBeenCalledTimes(1)
    const [url, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(url).toBe('/api/meeting-rooms/management')
    expect(config?.params).toEqual({})
  })

  it('available/bookedInFuture/page/size를 모두 지정하면 params에 그대로 반영된다', async () => {
    await getMeetingRoomManagementList({ available: true, bookedInFuture: false, page: 1, size: 20 })

    const [, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(config?.params).toEqual({ available: true, bookedInFuture: false, page: 1, size: 20 })
  })

  it('available/bookedInFuture가 false여도(falsy) 생략되지 않고 params에 포함된다', async () => {
    await getMeetingRoomManagementList({ available: false, bookedInFuture: false })

    const [, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(config?.params).toEqual({ available: false, bookedInFuture: false })
  })

  it('page/size가 0이어도(falsy) 생략되지 않고 params에 포함된다', async () => {
    await getMeetingRoomManagementList({ page: 0, size: 0 })

    const [, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(config?.params).toEqual({ page: 0, size: 0 })
  })

  it('응답을 그대로 반환한다(파싱 가공 없음)', async () => {
    const page = {
      content: [{ meetingRoomId: 1, name: '대회의실', capacity: 10, isAvailable: true }],
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

    const result = await getMeetingRoomManagementList()

    expect(result).toEqual(page)
  })
})
