import { describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { deleteEmpFile } from './deleteEmpFile'

/** deleteEmpFile(EMP_FILE_DELETE) 단위 테스트. */

vi.mock('@/shared/api/client', () => ({
  apiClient: { delete: vi.fn().mockResolvedValue({ data: undefined }) },
}))

describe('deleteEmpFile', () => {
  it('DELETE /api/employees/{empId}/files/{fileId}를 요청한다', async () => {
    await deleteEmpFile(7, 3)

    expect(apiClient.delete).toHaveBeenCalledTimes(1)
    expect(apiClient.delete).toHaveBeenCalledWith('/api/employees/7/files/3')
  })
})
