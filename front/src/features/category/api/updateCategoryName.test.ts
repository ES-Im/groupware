import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { updateCategoryName } from './updateCategoryName'

vi.mock('@/shared/api/client', () => ({
  apiClient: { patch: vi.fn() },
}))

describe('updateCategoryName', () => {
  beforeEach(() => {
    vi.mocked(apiClient.patch).mockReset()
    vi.mocked(apiClient.patch).mockResolvedValue({ data: undefined })
  })

  it('/api/categories/{categoryId}/name으로 PATCH하고 body에 categoryName을 그대로 담는다', async () => {
    await updateCategoryName(1, '변경된 이름')

    expect(apiClient.patch).toHaveBeenCalledTimes(1)
    const [url, body] = vi.mocked(apiClient.patch).mock.calls[0]
    expect(url).toBe('/api/categories/1/name')
    expect(body).toEqual({ categoryName: '변경된 이름' })
  })

  it('서버 판정 실패(중복 등)는 삼켜지지 않고 그대로 throw된다', async () => {
    vi.mocked(apiClient.patch).mockRejectedValueOnce(new Error('request failed'))

    await expect(updateCategoryName(1, '변경된 이름')).rejects.toThrow('request failed')
  })
})
