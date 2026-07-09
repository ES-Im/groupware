import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { checkOut } from './checkOut'

/**
 * checkOut(F302·MY_ATTENDANCE_CHECK_OUT, ROADMAP T2.2) 단위 테스트.
 *
 * apiClient.patch를 직접 모킹해 axios 호출 인자(URL, 바디 없음)만 검증한다
 * (getMyAttendanceMonthly.test.ts와 동일 패턴).
 */

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
