import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { getMyAttendanceMonthly } from './getMyAttendanceMonthly'

vi.mock('@/shared/api/client', () => ({
  apiClient: { get: vi.fn().mockResolvedValue({ data: undefined }) },
}))

describe('getMyAttendanceMonthly', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockClear()
  })

  it('파라미터를 하나도 주지 않으면 params 객체가 빈 객체다', async () => {
    await getMyAttendanceMonthly()

    expect(apiClient.get).toHaveBeenCalledTimes(1)
    const [url, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(url).toBe('/api/employees/attendances/me/monthly')
    expect(config?.params).toEqual({})
  })

  it('yearMonth/status/page/size를 모두 지정하면 params에 그대로 반영된다', async () => {
    await getMyAttendanceMonthly({
      yearMonth: '2026-07',
      status: 'LATE_EARLY',
      page: 2,
      size: 20,
    })

    const [, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(config?.params).toEqual({
      yearMonth: '2026-07',
      status: 'LATE_EARLY',
      page: 2,
      size: 20,
    })
  })

  it('status는 AttendanceStatus 6개 리터럴 중 어떤 값이든 그대로 전달한다', async () => {
    const statuses = [
      'NORMAL',
      'LATE_EARLY',
      'HALF_DAY_LEAVE',
      'ALL_DAY_LEAVE',
      'SICK_LEAVE',
      'ABSENT',
    ] as const

    for (const status of statuses) {
      vi.mocked(apiClient.get).mockClear()
      await getMyAttendanceMonthly({ status })
      const [, config] = vi.mocked(apiClient.get).mock.calls[0]
      expect(config?.params).toEqual({ status })
    }
  })

  it('page/size가 0이어도(falsy) 생략되지 않고 params에 포함된다', async () => {
    await getMyAttendanceMonthly({ page: 0, size: 0 })

    const [, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(config?.params).toEqual({ page: 0, size: 0 })
  })

  it('yearMonth만 지정하면 status/page/size는 params에서 생략된다', async () => {
    await getMyAttendanceMonthly({ yearMonth: '2026-01' })

    const [, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(config?.params).toEqual({ yearMonth: '2026-01' })
  })
})
