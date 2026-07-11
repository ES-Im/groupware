import { describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { updateDeptManagedInfo } from './updateDeptManagedInfo'

/**
 * updateDeptManagedInfo(DEPT_MANAGER_UPDATE_EMP_INFO) 단위 테스트.
 * apiClient.patch 직접 모킹으로 URL/바디만 검증한다(uploadEmpFile.test.ts와 동일 패턴).
 */

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

  // EmpUpdateRequestByDeptManager.java 실측: partial-update 계약이라 extensionNo를 아예 생략한
  // 값도 그대로 통과시켜야 한다(호출부 DeptManagedInfoDialog가 빈 문자열을 undefined로 변환해 넘김).
  it('extensionNo가 없는 값도 그대로 전송한다', async () => {
    const values = { systemRoleCode: ['EMPLOYEE'] }

    await updateDeptManagedInfo(9, values)

    expect(apiClient.patch).toHaveBeenCalledWith('/api/employees/9/dept-managed-info', values)
  })
})
