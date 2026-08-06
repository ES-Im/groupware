import { describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import type { EmpBelongingsCreatePayload } from '../model/empBelongingsCreatePayload'
import { updateEmpBelongings } from './updateEmpBelongings'

vi.mock('@/shared/api/client', () => ({
  apiClient: { patch: vi.fn().mockResolvedValue({ data: undefined }) },
}))

describe('updateEmpBelongings', () => {
  it('PATCH /api/employees/{empId}/belongings로 신규 소속 등록 payload를 그대로 전송한다', async () => {
    const payload: EmpBelongingsCreatePayload = {
      deptId: 2,
      position: 'STAFF',
      isPrimary: true,
      startAt: '2026-01-01',
      endAt: null,
    }

    await updateEmpBelongings(7, payload)

    expect(apiClient.patch).toHaveBeenCalledTimes(1)
    expect(apiClient.patch).toHaveBeenCalledWith('/api/employees/7/belongings', payload)
  })
})
