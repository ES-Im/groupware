import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { getDeptAttendanceMonthly } from './getDeptAttendanceMonthly'

vi.mock('@/shared/api/client', () => ({
  apiClient: { get: vi.fn().mockResolvedValue({ data: undefined }) },
}))

describe('getDeptAttendanceMonthly', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockClear()
  })

  it('deptId path param을 포함한 URL로 요청하고, 파라미터를 하나도 주지 않으면 params 객체가 빈 객체다', async () => {
    await getDeptAttendanceMonthly(1)

    expect(apiClient.get).toHaveBeenCalledTimes(1)
    const [url, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(url).toBe('/api/employees/attendances/1/monthly')
    expect(config?.params).toEqual({})
  })

  it('yearMonth/keyword/status/page/size를 모두 지정하면 params에 그대로 반영된다', async () => {
    await getDeptAttendanceMonthly(2, {
      yearMonth: '2026-07',
      keyword: '홍길동',
      status: 'LATE_EARLY',
      page: 2,
      size: 20,
    })

    const [url, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(url).toBe('/api/employees/attendances/2/monthly')
    expect(config?.params).toEqual({
      yearMonth: '2026-07',
      keyword: '홍길동',
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
      await getDeptAttendanceMonthly(1, { status })
      const [, config] = vi.mocked(apiClient.get).mock.calls[0]
      expect(config?.params).toEqual({ status })
    }
  })

  it('page/size가 0이어도(falsy) 생략되지 않고 params에 포함된다', async () => {
    await getDeptAttendanceMonthly(1, { page: 0, size: 0 })

    const [, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(config?.params).toEqual({ page: 0, size: 0 })
  })

  it('yearMonth만 지정하면 keyword/status/page/size는 params에서 생략된다', async () => {
    await getDeptAttendanceMonthly(1, { yearMonth: '2026-01' })

    const [, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(config?.params).toEqual({ yearMonth: '2026-01' })
  })

  it('keyword가 빈 문자열이면(falsy) params에서 생략된다', async () => {
    await getDeptAttendanceMonthly(1, { keyword: '' })

    const [, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(config?.params).toEqual({})
  })
})
