import { describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { cancelSchedule } from './cancelSchedule'

/**
 * cancelSchedule(F007, ROADMAP(SCHEDULE) T6.1) 단위 테스트.
 */
vi.mock('@/shared/api/client', () => ({
  apiClient: { patch: vi.fn().mockResolvedValue({ data: undefined }) },
}))

describe('cancelSchedule', () => {
  it('scope 없이 호출하면 요청 본문 없이 PATCH를 호출한다', async () => {
    await cancelSchedule(10)

    expect(apiClient.patch).toHaveBeenCalledWith('/api/schedules/10/cancellation', undefined, {
      params: { scope: undefined },
    })
  })

  it('scope=SERIES로 호출하면 해당 쿼리를 포함해 PATCH를 호출한다', async () => {
    await cancelSchedule(10, 'SERIES')

    expect(apiClient.patch).toHaveBeenCalledWith('/api/schedules/10/cancellation', undefined, {
      params: { scope: 'SERIES' },
    })
  })
})
