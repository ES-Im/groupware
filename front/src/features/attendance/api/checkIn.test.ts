import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { checkIn } from './checkIn'

/**
 * checkIn(F301·MY_ATTENDANCE_CHECK_IN, ROADMAP T2.2) 단위 테스트.
 *
 * apiClient.post를 직접 모킹해 axios 호출 인자(URL, 바디 없음)만 검증한다
 * (getMyAttendanceMonthly.test.ts와 동일 패턴).
 */

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
