import { describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { updateDeptManagedInfo } from './updateDeptManagedInfo'

vi.mock('@/shared/api/client', () => ({
  apiClient: { patch: vi.fn().mockResolvedValue({ data: undefined }) },
}))

describe('updateDeptManagedInfo', () => {
  it('PATCH /api/employees/{empId}/dept-managed-info로 폼 값 전체를 그대로 전송한다', async () => {
    const values = {
      extensionNo: '101-0001',
      systemRoleCode: ['EMPLOYEE'],
    }

    await updateDeptManagedInfo(9, values)

    expect(apiClient.patch).toHaveBeenCalledTimes(1)
    expect(apiClient.patch).toHaveBeenCalledWith('/api/employees/9/dept-managed-info', values)
  })

  it('extensionNo가 없는 값도 그대로 전송한다', async () => {
    const values = { systemRoleCode: ['EMPLOYEE'] }

    await updateDeptManagedInfo(9, values)

    expect(apiClient.patch).toHaveBeenCalledWith('/api/employees/9/dept-managed-info', values)
  })
})
