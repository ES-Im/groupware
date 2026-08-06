import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { getDeptLeaveHistory } from './getDeptLeaveHistory'

vi.mock('@/shared/api/client', () => ({
  apiClient: { get: vi.fn().mockResolvedValue({ data: undefined }) },
}))

describe('getDeptLeaveHistory', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockClear()
  })

  it('deptId path param을 포함한 URL로 요청하고, 파라미터를 하나도 주지 않으면 params 객체가 빈 객체다', async () => {
    await getDeptLeaveHistory(1)

    expect(apiClient.get).toHaveBeenCalledTimes(1)
    const [url, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(url).toBe('/api/leaves/departments/1/request-history')
    expect(config?.params).toEqual({})
  })

  it('keyword/approvalStatus/yearMonth/page/size를 모두 지정하면 params에 그대로 반영된다', async () => {
    await getDeptLeaveHistory(2, {
      keyword: '홍길동',
      approvalStatus: 'WAITING',
      yearMonth: '2026-07',
      page: 1,
      size: 20,
    })

    const [url, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(url).toBe('/api/leaves/departments/2/request-history')
    expect(config?.params).toEqual({
      keyword: '홍길동',
      approvalStatus: 'WAITING',
      yearMonth: '2026-07',
      page: 1,
      size: 20,
    })
  })

  it('page/size가 0이어도(falsy) 생략되지 않고 params에 포함된다', async () => {
    await getDeptLeaveHistory(1, { page: 0, size: 0 })

    const [, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(config?.params).toEqual({ page: 0, size: 0 })
  })

  it('keyword가 빈 문자열이면(falsy) params에서 생략된다', async () => {
    await getDeptLeaveHistory(1, { keyword: '' })

    const [, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(config?.params).toEqual({})
  })

  it('응답을 그대로 반환한다(파싱 가공 없음)', async () => {
    const page = {
      content: [
        {
          empId: 2,
          empNo: '202604001',
          empName: '홍길동',
          historyResponse: {
            draftId: 10,
            leaveType: '연차',
            startAt: '2026-04-10',
            endAt: '2026-04-10',
            requestedLeaveDays: 1.0,
            approvalStatus: '결재대기',
          },
        },
      ],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 10,
      numberOfElements: 1,
      first: true,
      last: true,
    }
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: page })

    const result = await getDeptLeaveHistory(1)

    expect(result).toEqual(page)
  })
})
