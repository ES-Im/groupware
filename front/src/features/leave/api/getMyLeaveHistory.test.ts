import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { getMyLeaveHistory } from './getMyLeaveHistory'

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
