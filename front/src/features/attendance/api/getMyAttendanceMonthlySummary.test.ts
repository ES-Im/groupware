import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { getMyAttendanceMonthlySummary } from './getMyAttendanceMonthlySummary'

/**
 * getMyAttendanceMonthlySummary(F304, ROADMAP T1.4) 단위 테스트.
 *
 * apiClient.get을 직접 모킹해 axios 호출 인자(URL, params)와 응답이 단일 객체
 * 그대로 반환되는지(배열로 잘못 파싱하지 않는지)를 검증한다.
 */

vi.mock('@/shared/api/client', () => ({
  apiClient: { get: vi.fn() },
}))

describe('getMyAttendanceMonthlySummary', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockClear()
  })

  it('yearMonth를 지정하지 않으면 params가 빈 객체다', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: undefined })

    await getMyAttendanceMonthlySummary()

    expect(apiClient.get).toHaveBeenCalledTimes(1)
    const [url, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(url).toBe('/api/employees/attendances/me/monthly/summary')
    expect(config?.params).toEqual({})
  })

  it('yearMonth를 지정하면 params에 그대로 반영된다', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: undefined })

    await getMyAttendanceMonthlySummary({ yearMonth: '2026-07' })

    const [, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(config?.params).toEqual({ yearMonth: '2026-07' })
  })

  it('응답을 배열이 아닌 단일 객체 그대로 반환한다', async () => {
    const summary = {
      approvedAttendanceCount: 10,
      pendingAttendanceCount: 2,
      totalAttendanceCount: 12,
      overtimeMinutes: 90,
    }
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: summary })

    const result = await getMyAttendanceMonthlySummary({ yearMonth: '2026-07' })

    expect(Array.isArray(result)).toBe(false)
    expect(result).toEqual(summary)
  })
})
