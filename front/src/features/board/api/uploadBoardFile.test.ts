import { describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { uploadBoardFile } from './uploadBoardFile'

vi.mock('@/shared/api/client', () => ({
  apiClient: { patch: vi.fn().mockResolvedValue({ data: undefined }) },
}))

describe('uploadBoardFile', () => {
  it('PATCH /api/boards/{boardId}/files를 part명 file(단수) 1개로 요청한다', async () => {
    const file = new File(['hello'], 'a.pdf', { type: 'application/pdf' })

    await uploadBoardFile(1, file)

    expect(apiClient.patch).toHaveBeenCalledTimes(1)
    const [url, body] = vi.mocked(apiClient.patch).mock.calls[0]
    expect(url).toBe('/api/boards/1/files')
    expect(body).toBeInstanceOf(FormData)
    const formData = body as FormData
    expect(formData.getAll('file')).toHaveLength(1)
    expect(formData.get('file')).toBe(file)
  })
})
