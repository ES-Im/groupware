import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { getDeptLeaveUsageSummary } from './getDeptLeaveUsageSummary'

vi.mock('@/shared/api/client', () => ({
  apiClient: { get: vi.fn().mockResolvedValue({ data: undefined }) },
}))

describe('getDeptLeaveUsageSummary', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockClear()
  })

  it('deptId path param을 포함한 URL로 요청하고, year 미지정 시 params 객체가 빈 객체다', async () => {
    await getDeptLeaveUsageSummary(1)

    expect(apiClient.get).toHaveBeenCalledTimes(1)
    const [url, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(url).toBe('/api/departments/1/employees/leaves/usage-summary')
    expect(config?.params).toEqual({})
  })

  it('year를 지정하면 params에 그대로 반영된다', async () => {
    await getDeptLeaveUsageSummary(2, { year: 2026 })

    const [url, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(url).toBe('/api/departments/2/employees/leaves/usage-summary')
    expect(config?.params).toEqual({ year: 2026 })
  })

  it('단일 값 응답을 그대로 반환한다(Page 래핑 아님)', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { annualLeaveUsagePercent: 20.0 } })

    const result = await getDeptLeaveUsageSummary(1)

    expect(result).toEqual({ annualLeaveUsagePercent: 20.0 })
  })
})
