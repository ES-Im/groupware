import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { registerCategory } from './registerCategory'

vi.mock('@/shared/api/client', () => ({
  apiClient: { post: vi.fn() },
}))

describe('registerCategory', () => {
  beforeEach(() => {
    vi.mocked(apiClient.post).mockReset()
    vi.mocked(apiClient.post).mockResolvedValue({ data: undefined })
  })

  it('/api/categories로 POST하고 body에 categoryName을 그대로 담는다', async () => {
    await registerCategory('공지사항')

    expect(apiClient.post).toHaveBeenCalledTimes(1)
    const [url, body] = vi.mocked(apiClient.post).mock.calls[0]
    expect(url).toBe('/api/categories')
    expect(body).toEqual({ categoryName: '공지사항' })
  })

  it('서버 판정 실패(중복 등)는 삼켜지지 않고 그대로 throw된다', async () => {
    vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('request failed'))

    await expect(registerCategory('공지사항')).rejects.toThrow('request failed')
  })
})
