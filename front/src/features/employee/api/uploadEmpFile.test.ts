import { describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { uploadEmpFile } from './uploadEmpFile'

/**
 * uploadEmpFile(EMP_FILE_UPLOAD) 단위 테스트.
 * apiClient.patch 직접 모킹으로 URL/쿼리(fileType)/FormData part명만 검증한다
 * (uploadMeetingRoomFile.test.ts와 동일 이유 — MSW+jsdom File 상호운용 한계 우회).
 */

vi.mock('@/shared/api/client', () => ({
  apiClient: { patch: vi.fn().mockResolvedValue({ data: undefined }) },
}))

describe('uploadEmpFile', () => {
  it('PATCH /api/employees/{empId}/files를 fileType 쿼리 + part명 file(단수) 1개로 요청한다', async () => {
    const file = new File(['image-bytes'], 'signature.png', { type: 'image/png' })

    await uploadEmpFile(7, 'SIGNATURE', file)

    expect(apiClient.patch).toHaveBeenCalledTimes(1)
    const [url, body, config] = vi.mocked(apiClient.patch).mock.calls[0]
    expect(url).toBe('/api/employees/7/files')
    expect(body).toBeInstanceOf(FormData)
    const formData = body as FormData
    expect(formData.getAll('file')).toHaveLength(1)
    expect(formData.get('file')).toBe(file)
    expect(config).toEqual({ params: { fileType: 'SIGNATURE' } })
  })
})
