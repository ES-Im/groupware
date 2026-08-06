import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { getDeptAttendancePending } from './getDeptAttendancePending'

vi.mock('@/shared/api/client', () => ({
  apiClient: { get: vi.fn().mockResolvedValue({ data: undefined }) },
}))

describe('getDeptAttendancePending', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockClear()
  })

  it('deptId path param을 포함한 URL로 요청하고, 파라미터를 하나도 주지 않으면 params 객체가 빈 객체다', async () => {
    await getDeptAttendancePending(1)

    expect(apiClient.get).toHaveBeenCalledTimes(1)
    const [url, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(url).toBe('/api/employees/attendances/1/monthly/pending')
    expect(config?.params).toEqual({})
  })

  it('page/size를 모두 지정하면 params에 그대로 반영된다', async () => {
    await getDeptAttendancePending(2, { page: 2, size: 20 })

    const [url, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(url).toBe('/api/employees/attendances/2/monthly/pending')
    expect(config?.params).toEqual({ page: 2, size: 20 })
  })

  it('page/size가 0이어도(falsy) 생략되지 않고 params에 포함된다', async () => {
    await getDeptAttendancePending(1, { page: 0, size: 0 })

    const [, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(config?.params).toEqual({ page: 0, size: 0 })
  })

  it('page만 지정하면 size는 params에서 생략된다', async () => {
    await getDeptAttendancePending(1, { page: 1 })

    const [, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(config?.params).toEqual({ page: 1 })
  })
})
