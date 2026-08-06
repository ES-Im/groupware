import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { getCategoryManagement } from './getCategoryManagement'

vi.mock('@/shared/api/client', () => ({
  apiClient: { get: vi.fn().mockResolvedValue({ data: undefined }) },
}))

describe('getCategoryManagement', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockClear()
  })

  it('파라미터를 하나도 주지 않으면 /api/categories/management를 빈 params로 호출한다', async () => {
    await getCategoryManagement()

    expect(apiClient.get).toHaveBeenCalledTimes(1)
    const [url, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(url).toBe('/api/categories/management')
    expect(config?.params).toEqual({})
  })

  it('keyword가 빈 문자열이면(falsy) params에서 생략된다', async () => {
    await getCategoryManagement({ keyword: '' })

    const [, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(config?.params).toEqual({})
  })

  it('isVisible이 false여도(falsy) != null이므로 params에 포함된다', async () => {
    await getCategoryManagement({ isVisible: false })

    const [, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(config?.params).toEqual({ isVisible: false })
  })

  it('page/size가 0이어도(falsy) != null이므로 params에 포함된다', async () => {
    await getCategoryManagement({ page: 0, size: 0 })

    const [, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(config?.params).toEqual({ page: 0, size: 0 })
  })

  it('keyword/isVisible/page/size를 모두 지정하면 params에 전부 반영된다', async () => {
    await getCategoryManagement({ keyword: '공지', isVisible: true, page: 1, size: 20 })

    const [url, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(url).toBe('/api/categories/management')
    expect(config?.params).toEqual({ keyword: '공지', isVisible: true, page: 1, size: 20 })
  })

  it('응답 Page<CategoryItem>를 가공 없이 그대로 반환한다', async () => {
    const page = {
      content: [{ categoryId: 1, categoryName: '공지사항', isVisible: true }],
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

    const result = await getCategoryManagement()

    expect(result).toEqual(page)
  })
})
