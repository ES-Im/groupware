import { describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { updateHrManagedInfo } from './updateHrManagedInfo'

vi.mock('@/shared/api/client', () => ({
  apiClient: { patch: vi.fn().mockResolvedValue({ data: undefined }) },
}))

describe('updateHrManagedInfo', () => {
  it('PATCH /api/employees/{empId}/hr-managed-info로 폼 값 전체를 그대로 전송한다', async () => {
    const values = {
      empName: '홍길동',
      password: 'abc12345!',
      extensionNo: '101-0001',
      systemRoleCode: ['EMPLOYEE', 'DEPT_MANAGER'],
      hireAt: '2024-01-01',
    }

    await updateHrManagedInfo(7, values)

    expect(apiClient.patch).toHaveBeenCalledTimes(1)
    expect(apiClient.patch).toHaveBeenCalledWith('/api/employees/7/hr-managed-info', values)
  })

  it('password/extensionNo가 없는 값도 그대로 전송한다', async () => {
    const values = { empName: '홍길동', systemRoleCode: ['EMPLOYEE'], hireAt: '2024-01-01' }

    await updateHrManagedInfo(7, values)

    expect(apiClient.patch).toHaveBeenCalledWith('/api/employees/7/hr-managed-info', values)
  })
})
