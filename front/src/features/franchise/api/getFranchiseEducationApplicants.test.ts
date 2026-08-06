import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { getFranchiseEducationApplicants } from './getFranchiseEducationApplicants'

vi.mock('@/shared/api/client', () => ({
  apiClient: { get: vi.fn().mockResolvedValue({ data: undefined }) },
}))

describe('getFranchiseEducationApplicants', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockClear()
  })

  it('파라미터를 주지 않으면 /api/franchise-educations/{educationId}/applicants를 빈 params로 호출한다', async () => {
    await getFranchiseEducationApplicants(1)

    expect(apiClient.get).toHaveBeenCalledTimes(1)
    const [url, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(url).toBe('/api/franchise-educations/1/applicants')
    expect(config?.params).toEqual({})
  })

  it('page/size가 0이어도(falsy) != null이므로 params에 포함된다', async () => {
    await getFranchiseEducationApplicants(1, { page: 0, size: 0 })

    const [, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(config?.params).toEqual({ page: 0, size: 0 })
  })

  it('page/size를 지정하면 params에 그대로 반영된다', async () => {
    await getFranchiseEducationApplicants(1, { page: 2, size: 10 })

    const [, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(config?.params).toEqual({ page: 2, size: 10 })
  })

  it('page만 지정하면 size는 params에서 생략된다', async () => {
    await getFranchiseEducationApplicants(1, { page: 1 })

    const [, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(config?.params).toEqual({ page: 1 })
    expect(config?.params).not.toHaveProperty('size')
  })

  it('응답 Page<FranchiseEducationApplicant>를 가공 없이 그대로 반환한다', async () => {
    const page = {
      content: [
        {
          applicationId: 1,
          externalId: 'EXT-1',
          franchiseId: 10,
          franchiseName: '테스트강남점',
          contactNumber: '02-1234-5678',
          contactEmail: 'gangnam@haruon.com',
          appliedCount: 2,
          appliedAt: '2026-05-01T09:00:00',
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

    const result = await getFranchiseEducationApplicants(1)

    expect(result).toEqual(page)
  })
})
