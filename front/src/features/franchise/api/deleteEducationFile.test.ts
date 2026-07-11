import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { deleteEducationFile } from './deleteEducationFile'

/**
 * deleteEducationFile(EDUCATION_FILE_DELETE) 단위 테스트.
 * apiClient.delete 직접 모킹으로 요청 URL만 검증한다(meeting deleteMeetingRoomFile.test.ts 동형).
 */

vi.mock('@/shared/api/client', () => ({
  apiClient: { delete: vi.fn().mockResolvedValue({ data: undefined }) },
}))

describe('deleteEducationFile', () => {
  beforeEach(() => {
    vi.mocked(apiClient.delete).mockClear()
  })

  it('/api/educations/{educationId}/files/{fileId}로 DELETE 요청한다', async () => {
    await deleteEducationFile(5, 10)

    expect(apiClient.delete).toHaveBeenCalledTimes(1)
    const [url] = vi.mocked(apiClient.delete).mock.calls[0]
    expect(url).toBe('/api/educations/5/files/10')
  })
})
