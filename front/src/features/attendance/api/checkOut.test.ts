import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { checkOut } from './checkOut'

vi.mock('@/shared/api/client', () => ({
  apiClient: { patch: vi.fn().mockResolvedValue({ data: undefined }) },
}))

describe('checkOut', () => {
  beforeEach(() => {
    vi.mocked(apiClient.patch).mockClear()
  })

  it('PATCH /api/employees/attendances/me/check-out을 바디 없이 호출한다', async () => {
    await checkOut()

    expect(apiClient.patch).toHaveBeenCalledTimes(1)
    expect(apiClient.patch).toHaveBeenCalledWith('/api/employees/attendances/me/check-out')

    const [, body] = vi.mocked(apiClient.patch).mock.calls[0]
    expect(body).toBeUndefined()
  })

  it('204 응답이므로 반환값이 없다(void)', async () => {
    const result = await checkOut()
    expect(result).toBeUndefined()
  })
})
