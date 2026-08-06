import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { activateCategory, deactivateCategory } from './toggleCategoryVisibility'

vi.mock('@/shared/api/client', () => ({
  apiClient: { patch: vi.fn() },
}))

describe('activateCategory', () => {
  beforeEach(() => {
    vi.mocked(apiClient.patch).mockReset()
    vi.mocked(apiClient.patch).mockResolvedValue({ data: undefined })
  })

  it('/api/categories/{categoryId}/visibility/activation으로 PATCH한다(본문 없음)', async () => {
    await activateCategory(1)

    expect(apiClient.patch).toHaveBeenCalledTimes(1)
    const [url, body] = vi.mocked(apiClient.patch).mock.calls[0]
    expect(url).toBe('/api/categories/1/visibility/activation')
    expect(body).toBeUndefined()
  })

  it('서버 판정 실패는 삼켜지지 않고 그대로 throw된다', async () => {
    vi.mocked(apiClient.patch).mockRejectedValueOnce(new Error('request failed'))

    await expect(activateCategory(1)).rejects.toThrow('request failed')
  })
})

describe('deactivateCategory', () => {
  beforeEach(() => {
    vi.mocked(apiClient.patch).mockReset()
    vi.mocked(apiClient.patch).mockResolvedValue({ data: undefined })
  })

  it('/api/categories/{categoryId}/visibility/deactivation으로 PATCH한다(본문 없음)', async () => {
    await deactivateCategory(1)

    expect(apiClient.patch).toHaveBeenCalledTimes(1)
    const [url, body] = vi.mocked(apiClient.patch).mock.calls[0]
    expect(url).toBe('/api/categories/1/visibility/deactivation')
    expect(body).toBeUndefined()
  })

  it('서버 판정 실패는 삼켜지지 않고 그대로 throw된다', async () => {
    vi.mocked(apiClient.patch).mockRejectedValueOnce(new Error('request failed'))

    await expect(deactivateCategory(1)).rejects.toThrow('request failed')
  })
})
