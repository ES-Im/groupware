import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { checkIn } from './checkIn'

vi.mock('@/shared/api/client', () => ({
  apiClient: { post: vi.fn().mockResolvedValue({ data: undefined }) },
}))

describe('checkIn', () => {
  beforeEach(() => {
    vi.mocked(apiClient.post).mockClear()
  })

  it('POST /api/employees/attendances/me/check-in을 바디 없이 호출한다', async () => {
    await checkIn()

    expect(apiClient.post).toHaveBeenCalledTimes(1)
    expect(apiClient.post).toHaveBeenCalledWith('/api/employees/attendances/me/check-in')

    const [, body] = vi.mocked(apiClient.post).mock.calls[0]
    expect(body).toBeUndefined()
  })

  it('204 응답이므로 반환값이 없다(void)', async () => {
    const result = await checkIn()
    expect(result).toBeUndefined()
  })
})
