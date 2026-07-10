import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { getMeetingRoomManagementList } from './getMeetingRoomManagementList'

/**
 * getMeetingRoomManagementList(F811, ROADMAP(MEETING-ROOMS) T6.1) 단위 테스트.
 *
 * apiClient.get을 직접 모킹해 axios 호출 인자(URL, params)만 검증한다
 * (meeting getManagementReservations.test.ts와 동일 패턴).
 *
 * available/bookedInFuture는 false도 유효한 값이므로 `!= null`로 판별한다 — false를 넘겨도
 * 생략되지 않아야 한다(department getDepartments의 isActive와 동일 계약).
 */

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
