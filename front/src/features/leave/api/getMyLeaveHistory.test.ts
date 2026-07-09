import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { getMyLeaveHistory } from './getMyLeaveHistory'

/**
 * getMyLeaveHistory(F742, ROADMAP(LEAVE) M3 T3.1) 단위 테스트.
 *
 * apiClient.get을 직접 모킹해 axios 호출 인자(URL, params)만 검증한다
 * (attendance getMyAttendanceMonthly.test.ts와 동일 패턴).
 *
 * approvalStatus/yearMonth는 둘 다 선택값이므로, 값이 없는 파라미터는 params 객체 자체에서
 * 생략되어야 한다(쿼리스트링에 노출되면 안 됨).
 */

vi.mock('@/shared/api/client', () => ({
  apiClient: { get: vi.fn().mockResolvedValue({ data: [] }) },
}))

describe('getMyLeaveHistory', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockClear()
  })

  it('파라미터를 하나도 주지 않으면 params 객체가 빈 객체다', async () => {
    await getMyLeaveHistory()

    expect(apiClient.get).toHaveBeenCalledTimes(1)
    const [url, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(url).toBe('/api/leaves/employees/me/request-history')
    expect(config?.params).toEqual({})
  })

  it('approvalStatus/yearMonth를 모두 지정하면 params에 그대로 반영된다', async () => {
    await getMyLeaveHistory({ approvalStatus: 'WAITING', yearMonth: '2026-04' })

    const [, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(config?.params).toEqual({ approvalStatus: 'WAITING', yearMonth: '2026-04' })
  })

  it('approvalStatus만 지정하면 yearMonth는 params에서 생략된다', async () => {
    await getMyLeaveHistory({ approvalStatus: 'APPROVED' })

    const [, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(config?.params).toEqual({ approvalStatus: 'APPROVED' })
  })

  it('응답 배열을 그대로 반환한다(파싱 가공 없음)', async () => {
    const entries = [
      {
        draftId: 10,
        leaveType: '연차',
        startAt: '2026-04-10',
        endAt: '2026-04-10',
        requestedLeaveDays: 1.0,
        approvalStatus: '결재대기',
      },
    ]
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: entries })

    const result = await getMyLeaveHistory()

    expect(result).toEqual(entries)
  })
})
