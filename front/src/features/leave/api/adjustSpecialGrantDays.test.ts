import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { adjustSpecialGrantDays } from './adjustSpecialGrantDays'

vi.mock('@/shared/api/client', () => ({
  apiClient: { patch: vi.fn().mockResolvedValue({ data: undefined }) },
}))

describe('adjustSpecialGrantDays', () => {
  beforeEach(() => {
    vi.mocked(apiClient.patch).mockClear()
  })

  it('empId path param을 그대로 사용한 URL로 PATCH 요청한다', async () => {
    await adjustSpecialGrantDays(2, 1.5)

    expect(apiClient.patch).toHaveBeenCalledTimes(1)
    const [url] = vi.mocked(apiClient.patch).mock.calls[0]
    expect(url).toBe('/api/employees/2/leaves/special-grant-days')
  })

  it('요청 본문은 null이고, plusMinusDays만 query params로 전달된다', async () => {
    await adjustSpecialGrantDays(2, 1.5)

    const [, body, config] = vi.mocked(apiClient.patch).mock.calls[0]
    expect(body).toBeNull()
    expect(config).toEqual({ params: { plusMinusDays: 1.5 } })
  })

  it('음수(차감)도 그대로 전달된다', async () => {
    await adjustSpecialGrantDays(2, -0.5)

    const [, , config] = vi.mocked(apiClient.patch).mock.calls[0]
    expect(config).toEqual({ params: { plusMinusDays: -0.5 } })
  })

  it('204 응답이므로 반환값이 없다(void)', async () => {
    const result = await adjustSpecialGrantDays(2, 1.5)
    expect(result).toBeUndefined()
  })
})
