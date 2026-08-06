import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { deleteMeetingRoomFile } from './deleteMeetingRoomFile'

vi.mock('@/shared/api/client', () => ({
  apiClient: { delete: vi.fn().mockResolvedValue({ data: undefined }) },
}))

describe('deleteMeetingRoomFile', () => {
  beforeEach(() => {
    vi.mocked(apiClient.delete).mockClear()
  })

  it('/api/meeting-rooms/{meetingRoomId}/files/{fileId}로 DELETE 요청한다', async () => {
    await deleteMeetingRoomFile(5, 10)

    expect(apiClient.delete).toHaveBeenCalledTimes(1)
    const [url] = vi.mocked(apiClient.delete).mock.calls[0]
    expect(url).toBe('/api/meeting-rooms/5/files/10')
  })
})
