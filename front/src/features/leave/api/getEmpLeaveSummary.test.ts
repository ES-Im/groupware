import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { getEmpLeaveSummary } from './getEmpLeaveSummary'

vi.mock('@/shared/api/client', () => ({
  apiClient: { get: vi.fn().mockResolvedValue({ data: undefined }) },
}))

describe('getEmpLeaveSummary', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockClear()
  })

  it('파라미터를 하나도 주지 않으면 params 객체가 빈 객체다', async () => {
    await getEmpLeaveSummary()

    expect(apiClient.get).toHaveBeenCalledTimes(1)
    const [url, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(url).toBe('/api/employees/leaves/summary')
    expect(config?.params).toEqual({})
  })

  it('keyword/deptId/year/page/size를 모두 지정하면 params에 그대로 반영된다', async () => {
    await getEmpLeaveSummary({ keyword: '홍길동', deptId: 1, year: 2026, page: 2, size: 20 })

    const [url, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(url).toBe('/api/employees/leaves/summary')
    expect(config?.params).toEqual({
      keyword: '홍길동',
      deptId: 1,
      year: 2026,
      page: 2,
      size: 20,
    })
  })

  it('page/size가 0이어도(falsy) 생략되지 않고 params에 포함된다', async () => {
    await getEmpLeaveSummary({ page: 0, size: 0 })

    const [, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(config?.params).toEqual({ page: 0, size: 0 })
  })

  it('keyword가 빈 문자열이면(falsy) params에서 생략된다', async () => {
    await getEmpLeaveSummary({ keyword: '' })

    const [, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(config?.params).toEqual({})
  })

  it('deptId만 지정하면 keyword/year/page/size는 params에서 생략된다', async () => {
    await getEmpLeaveSummary({ deptId: 3 })

    const [, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(config?.params).toEqual({ deptId: 3 })
  })
})
