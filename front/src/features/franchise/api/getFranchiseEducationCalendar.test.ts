import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { getFranchiseEducationCalendar } from './getFranchiseEducationCalendar'

vi.mock('@/shared/api/client', () => ({
  apiClient: { get: vi.fn().mockResolvedValue({ data: [] }) },
}))

describe('getFranchiseEducationCalendar', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockClear()
  })

  it('params 미전달 시 GET /api/franchise-educations/calendar를 빈 params로 호출한다', async () => {
    await getFranchiseEducationCalendar()

    expect(apiClient.get).toHaveBeenCalledTimes(1)
    const [url, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(url).toBe('/api/franchise-educations/calendar')
    expect(config?.params).toEqual({})
  })

  it('start/end가 undefined면(훅 최초 마운트) params에서 둘 다 생략된다', async () => {
    await getFranchiseEducationCalendar({ start: undefined, end: undefined })

    const [, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(config?.params).toEqual({})
  })

  it('start/end를 지정하면 params에 그대로 반영된다', async () => {
    await getFranchiseEducationCalendar({
      start: '2026-07-01T00:00:00',
      end: '2026-08-01T00:00:00',
    })

    const [, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(config?.params).toEqual({
      start: '2026-07-01T00:00:00',
      end: '2026-08-01T00:00:00',
    })
  })

  it('start만 지정하면 end는 params에서 생략된다', async () => {
    await getFranchiseEducationCalendar({ start: '2026-07-01T00:00:00' })

    const [, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(config?.params).toEqual({ start: '2026-07-01T00:00:00' })
  })

  it('응답 루트 배열을 가공 없이 그대로 반환한다', async () => {
    const items = [
      {
        id: 1,
        date: '2026-05-01',
        place: '교육장',
        title: '교육 제목',
        isFull: false,
        isActive: true,
      },
    ]
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: items })

    const result = await getFranchiseEducationCalendar()

    expect(result).toEqual(items)
  })
})
