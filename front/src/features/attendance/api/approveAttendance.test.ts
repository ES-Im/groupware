import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { approveAttendance } from './approveAttendance'

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
