import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { getFranchiseInquiries } from './getFranchiseInquiries'

vi.mock('@/shared/api/client', () => ({
  apiClient: { get: vi.fn().mockResolvedValue({ data: undefined }) },
}))

describe('getFranchiseInquiries', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockClear()
  })

  it('파라미터를 하나도 주지 않으면 /api/franchise-inquiries를 빈 params로 호출한다', async () => {
    await getFranchiseInquiries()

    expect(apiClient.get).toHaveBeenCalledTimes(1)
    const [url, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(url).toBe('/api/franchise-inquiries')
    expect(config?.params).toEqual({})
  })

  it('isAnswered가 false여도(falsy) != null이므로 params에 포함된다', async () => {
    await getFranchiseInquiries({ isAnswered: false })

    const [, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(config?.params).toEqual({ isAnswered: false })
  })

  it('isAnswered가 true면 params에 포함된다', async () => {
    await getFranchiseInquiries({ isAnswered: true })

    const [, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(config?.params).toEqual({ isAnswered: true })
  })

  it('isAnswered를 지정하지 않으면 params에서 생략된다', async () => {
    await getFranchiseInquiries({ keyword: '문의' })

    const [, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(config?.params).not.toHaveProperty('isAnswered')
  })

  it('assignedManagerId가 0이어도(falsy) != null이므로 params에 포함된다', async () => {
    await getFranchiseInquiries({ assignedManagerId: 0 })

    const [, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(config?.params).toEqual({ assignedManagerId: 0 })
  })

  it('keyword가 빈 문자열이면(falsy) params에서 생략된다', async () => {
    await getFranchiseInquiries({ keyword: '' })

    const [, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(config?.params).toEqual({})
  })

  it('keyword를 지정하면 params에 그대로 반영된다', async () => {
    await getFranchiseInquiries({ keyword: '환불' })

    const [, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(config?.params).toEqual({ keyword: '환불' })
  })

  it('from/to를 지정하면 params에 그대로 반영된다', async () => {
    await getFranchiseInquiries({ from: '2026-07-01', to: '2026-07-31' })

    const [, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(config?.params).toEqual({ from: '2026-07-01', to: '2026-07-31' })
  })

  it('page/size가 0이어도(falsy) != null이므로 params에 포함된다', async () => {
    await getFranchiseInquiries({ page: 0, size: 0 })

    const [, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(config?.params).toEqual({ page: 0, size: 0 })
  })

  it('모든 파라미터를 지정하면 params에 전부 반영된다', async () => {
    await getFranchiseInquiries({
      isAnswered: true,
      assignedManagerId: 7,
      keyword: '환불',
      from: '2026-07-01',
      to: '2026-07-31',
      page: 1,
      size: 20,
    })

    const [url, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(url).toBe('/api/franchise-inquiries')
    expect(config?.params).toEqual({
      isAnswered: true,
      assignedManagerId: 7,
      keyword: '환불',
      from: '2026-07-01',
      to: '2026-07-31',
      page: 1,
      size: 20,
    })
  })

  it('응답 Page<FranchiseInquiry>를 가공 없이 그대로 반환한다', async () => {
    const page = {
      content: [
        {
          inquiryId: 1,
          externalId: 'EXT-1',
          franchiseId: 10,
          franchiseName: '테스트강남점',
          inquiryTitle: '환불 문의',
          inquiryAt: '2026-07-01T10:00:00',
          isAnswered: false,
          assignedManagerId: 7,
          assignedManagerName: '김담당',
          isDeleted: false,
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

    const result = await getFranchiseInquiries()

    expect(result).toEqual(page)
    expect(result.content[0].isAnswered).toBe(false)
  })
})
