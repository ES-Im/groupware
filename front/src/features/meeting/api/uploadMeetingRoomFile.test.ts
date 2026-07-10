import { describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { uploadMeetingRoomFile } from './uploadMeetingRoomFile'

/**
 * uploadMeetingRoomFile(F815, ROADMAP(MEETING-ROOMS) T7.1) 단위 테스트.
 * apiClient.patch 직접 모킹으로 URL/FormData part명만 검증한다(board uploadBoardFile.test.ts와
 * 동일 이유 — MSW+jsdom File 상호운용 한계 우회).
 */

vi.mock('@/shared/api/client', () => ({
  apiClient: { patch: vi.fn().mockResolvedValue({ data: undefined }) },
}))

describe('uploadMeetingRoomFile', () => {
  it('PATCH /api/meeting-rooms/{id}/files를 part명 file(단수) 1개로 요청한다', async () => {
    const file = new File(['image-bytes'], 'room.jpg', { type: 'image/jpeg' })

    await uploadMeetingRoomFile(5, file)

    expect(apiClient.patch).toHaveBeenCalledTimes(1)
    const [url, body] = vi.mocked(apiClient.patch).mock.calls[0]
    expect(url).toBe('/api/meeting-rooms/5/files')
    expect(body).toBeInstanceOf(FormData)
    const formData = body as FormData
    expect(formData.getAll('file')).toHaveLength(1)
    expect(formData.get('file')).toBe(file)
  })
})
