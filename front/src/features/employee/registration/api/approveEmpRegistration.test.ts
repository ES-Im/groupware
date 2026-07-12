import { describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { approveEmpRegistration } from './approveEmpRegistration'

/**
 * approveEmpRegistration(HR_APPROVE_EMP_REGISTRATION) 단위 테스트.
 * apiClient.patch 직접 모킹으로 URL/바디/쿼리 파라미터만 검증한다(updateHrManagedInfo.test.ts와 동일 패턴).
 * hiredAt은 쿼리 파라미터로 전송하고, 바디 자리는 null을 명시 전달해야 한다(http-request.adoc 실측:
 * application/x-www-form-urlencoded, 바디 값 없음).
 */

vi.mock('@/shared/api/client', () => ({
  apiClient: { patch: vi.fn().mockResolvedValue({ data: undefined }) },
}))

describe('approveEmpRegistration', () => {
  it('PATCH /api/employees/{empId}/registration-approval을 hiredAt 쿼리 파라미터와 함께 요청한다', async () => {
    await approveEmpRegistration(2, '2026-01-01')

    expect(apiClient.patch).toHaveBeenCalledTimes(1)
    expect(apiClient.patch).toHaveBeenCalledWith(
      '/api/employees/2/registration-approval',
      null,
      { params: { hiredAt: '2026-01-01' } },
    )
  })

  it('바디 자리는 undefined가 아니라 null을 명시 전달한다', async () => {
    await approveEmpRegistration(7, '2024-03-05')

    const [, body] = vi.mocked(apiClient.patch).mock.calls[0]
    expect(body).toBeNull()
  })
})
