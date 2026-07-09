import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { approveAttendance } from './approveAttendance'

/**
 * approveAttendance(F308·DEPT_ATTENDANCE_APPROVE, ROADMAP T4.4) 단위 테스트.
 *
 * apiClient.patch를 직접 모킹해 axios 호출 인자(URL에 attendanceId path param 포함,
 * 본문 없음, query에 targetEmpId·approvedAt)만 검증한다(updateAttendance.test.ts와
 * 동일한 스타일).
 */

vi.mock('@/shared/api/client', () => ({
  apiClient: { patch: vi.fn().mockResolvedValue({ data: undefined }) },
}))

describe('approveAttendance', () => {
  beforeEach(() => {
    vi.mocked(apiClient.patch).mockClear()
  })

  it('attendanceId path param을 그대로 사용한 URL로 PATCH 요청한다', async () => {
    await approveAttendance(10, 2, '2026-04-30T09:00:00')

    expect(apiClient.patch).toHaveBeenCalledTimes(1)
    const [url] = vi.mocked(apiClient.patch).mock.calls[0]
    expect(url).toBe('/api/employees/attendances/10/approval')
  })

  it('요청 본문은 null이고, targetEmpId·approvedAt만 query params로 전달된다', async () => {
    await approveAttendance(10, 2, '2026-04-30T09:00:00')

    const [, body, config] = vi.mocked(apiClient.patch).mock.calls[0]
    expect(body).toBeNull()
    expect(config).toEqual({ params: { targetEmpId: 2, approvedAt: '2026-04-30T09:00:00' } })
  })

  it('204 응답이므로 반환값이 없다(void)', async () => {
    const result = await approveAttendance(10, 2, '2026-04-30T09:00:00')
    expect(result).toBeUndefined()
  })
})
