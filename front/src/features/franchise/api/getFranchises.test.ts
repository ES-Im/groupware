import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { getFranchises } from './getFranchises'

vi.mock('@/shared/api/client', () => ({
  apiClient: { get: vi.fn().mockResolvedValue({ data: undefined }) },
}))

describe('getFranchises', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockClear()
  })

  it('파라미터를 하나도 주지 않으면 /api/franchises를 빈 params로 호출한다', async () => {
    await getFranchises()

    expect(apiClient.get).toHaveBeenCalledTimes(1)
    const [url, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(url).toBe('/api/franchises')
    expect(config?.params).toEqual({})
  })

  it('keyword를 지정하면 params에 그대로 반영된다', async () => {
    await getFranchises({ keyword: '강남' })

    const [, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(config?.params).toEqual({ keyword: '강남' })
  })

  it('keyword가 빈 문자열이면(falsy) params에서 생략된다', async () => {
    await getFranchises({ keyword: '' })

    const [, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(config?.params).toEqual({})
  })

  it('status가 빈 문자열이면(falsy) params에서 생략된다', async () => {
    await getFranchises({ status: '' })

    const [, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(config?.params).toEqual({})
  })

  it('status를 지정하면 params에 그대로 반영된다', async () => {
    await getFranchises({ status: '정상 영업 중' })

    const [, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(config?.params).toEqual({ status: '정상 영업 중' })
  })

  it('managerId가 0이어도(falsy) != null이므로 params에 포함된다', async () => {
    await getFranchises({ managerId: 0 })

    const [, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(config?.params).toEqual({ managerId: 0 })
  })

  it('managerId를 지정하지 않으면 params에서 생략된다', async () => {
    await getFranchises({ keyword: '강남' })

    const [, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(config?.params).not.toHaveProperty('managerId')
  })

  it('page/size가 0이어도(falsy) != null이므로 params에 포함된다', async () => {
    await getFranchises({ page: 0, size: 0 })

    const [, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(config?.params).toEqual({ page: 0, size: 0 })
  })

  it('keyword/status/managerId/page/size를 모두 지정하면 params에 전부 반영된다', async () => {
    await getFranchises({ keyword: '강남', status: '정상 영업 중', managerId: 7, page: 1, size: 20 })

    const [url, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(url).toBe('/api/franchises')
    expect(config?.params).toEqual({
      keyword: '강남',
      status: '정상 영업 중',
      managerId: 7,
      page: 1,
      size: 20,
    })
  })

  it('응답 Page<Franchise>를 가공 없이 그대로 반환한다(BusinessStatus 필드 보존)', async () => {
    const page = {
      content: [
        {
          id: 1,
          name: '테스트강남점',
          address: '서울특별시 강남구',
          ownerName: '홍길동',
          BusinessStatus: '정상 영업 중',
          managerEmpId: 1,
          managerEmpName: '김담당',
        },
      ],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 10,
      numberOfElements: 1,
      first: true,
      last: true,
      empty: false,
    }
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: page })

    const result = await getFranchises()

    expect(result).toEqual(page)
    expect(result.content[0].BusinessStatus).toBe('정상 영업 중')
  })
})
