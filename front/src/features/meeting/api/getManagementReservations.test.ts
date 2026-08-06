import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { getManagementReservations } from './getManagementReservations'

vi.mock('@/shared/api/client', () => ({
  apiClient: { get: vi.fn().mockResolvedValue({ data: undefined }) },
}))

describe('getManagementReservations', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockClear()
  })

  it('파라미터를 하나도 주지 않으면 /api/meetings로 요청하고 params 객체가 빈 객체다', async () => {
    await getManagementReservations()

    expect(apiClient.get).toHaveBeenCalledTimes(1)
    const [url, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(url).toBe('/api/meetings')
    expect(config?.params).toEqual({})
  })

  it('yearMonth/keyword/meetingRoomId/page/size를 모두 지정하면 params에 그대로 반영된다', async () => {
    await getManagementReservations({
      yearMonth: '2026-07',
      keyword: '기획',
      meetingRoomId: 3,
      page: 1,
      size: 20,
    })

    const [url, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(url).toBe('/api/meetings')
    expect(config?.params).toEqual({
      yearMonth: '2026-07',
      keyword: '기획',
      meetingRoomId: 3,
      page: 1,
      size: 20,
    })
  })

  it('page/size가 0이어도(falsy) 생략되지 않고 params에 포함된다', async () => {
    await getManagementReservations({ page: 0, size: 0 })

    const [, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(config?.params).toEqual({ page: 0, size: 0 })
  })

  it('meetingRoomId가 0이어도 생략되지 않지만, keyword가 빈 문자열이면(falsy) params에서 생략된다', async () => {
    await getManagementReservations({ meetingRoomId: 0, keyword: '' })

    const [, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(config?.params).toEqual({ meetingRoomId: 0 })
  })

  it('응답을 그대로 반환한다(파싱 가공 없음)', async () => {
    const page = {
      content: [
        {
          meetingId: 1,
          meetingRoomId: 2,
          meetingRoomName: '대회의실',
          reserverId: 3,
          reserverDeptName: '기획팀',
          reserverEmpName: '홍길동',
          title: '주간 회의',
          meetingDate: '2026-07-10',
          startAt: '10:00',
          endAt: '11:00',
          isCanceled: false,
          participantCount: 4,
        },
      ],
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

    const result = await getManagementReservations()

    expect(result).toEqual(page)
  })
})
