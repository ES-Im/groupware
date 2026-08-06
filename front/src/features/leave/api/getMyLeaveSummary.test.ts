import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { getMyLeaveSummary } from './getMyLeaveSummary'

vi.mock('@/shared/api/client', () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({
      data: {
        annualBaseGrantDays: 15,
        annualUsedDays: 2,
        specialGrantDays: 1,
        specialUsedDays: 0.5,
        compensatoryGrantDays: 3,
        compensatoryUsedDays: 1,
      },
    }),
  },
}))

describe('getMyLeaveSummary', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockClear()
  })

  it('year를 주지 않으면 params 객체가 빈 객체다', async () => {
    await getMyLeaveSummary()

    expect(apiClient.get).toHaveBeenCalledTimes(1)
    const [url, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(url).toBe('/api/employees/me/leaves/summary')
    expect(config?.params).toEqual({})
  })

  it('year를 지정하면 params에 그대로 반영된다', async () => {
    await getMyLeaveSummary({ year: 2026 })

    const [, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(config?.params).toEqual({ year: 2026 })
  })

  it('응답 객체를 그대로 반환한다(잔여 계산 없이 원본 부여/사용 값만)', async () => {
    const result = await getMyLeaveSummary()

    expect(result).toEqual({
      annualBaseGrantDays: 15,
      annualUsedDays: 2,
      specialGrantDays: 1,
      specialUsedDays: 0.5,
      compensatoryGrantDays: 3,
      compensatoryUsedDays: 1,
    })
  })
})
