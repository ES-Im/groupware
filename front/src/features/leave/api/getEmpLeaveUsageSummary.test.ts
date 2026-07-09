import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { getEmpLeaveUsageSummary } from './getEmpLeaveUsageSummary'

/**
 * getEmpLeaveUsageSummary(F748, ROADMAP(LEAVE) M5 T5.1) 단위 테스트.
 * apiClient.get을 직접 모킹해 axios 호출 인자(URL, params)만 검증한다.
 */

vi.mock('@/shared/api/client', () => ({
  apiClient: { get: vi.fn().mockResolvedValue({ data: undefined }) },
}))

describe('getEmpLeaveUsageSummary', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockClear()
  })

  it('파라미터를 하나도 주지 않으면 params 객체가 빈 객체다', async () => {
    await getEmpLeaveUsageSummary()

    expect(apiClient.get).toHaveBeenCalledTimes(1)
    const [url, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(url).toBe('/api/employees/leaves/usage-summary')
    expect(config?.params).toEqual({})
  })

  it('deptId/year를 모두 지정하면 params에 그대로 반영된다', async () => {
    await getEmpLeaveUsageSummary({ deptId: 1, year: 2026 })

    const [, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(config?.params).toEqual({ deptId: 1, year: 2026 })
  })

  it('deptId만 지정하면 year는 params에서 생략된다', async () => {
    await getEmpLeaveUsageSummary({ deptId: 2 })

    const [, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(config?.params).toEqual({ deptId: 2 })
  })

  it('응답 객체를 그대로 반환한다(파싱 가공 없음)', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { annualLeaveUsagePercent: 25.0 } })

    const result = await getEmpLeaveUsageSummary()

    expect(result).toEqual({ annualLeaveUsagePercent: 25.0 })
  })
})
