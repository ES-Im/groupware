import { describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { getMeetingRoomFiles } from './getMeetingRoomFiles'

/**
 * getMeetingRoomFiles(F808, ROADMAP T2.2) 단위 테스트.
 */
vi.mock('@/shared/api/client', () => ({
  apiClient: { get: vi.fn() },
}))

describe('getMeetingRoomFiles', () => {
  it('GET /api/meeting-rooms/{meetingRoomId}/files를 호출한다', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: [] })

    await getMeetingRoomFiles(3)

    expect(apiClient.get).toHaveBeenCalledWith('/api/meeting-rooms/3/files')
  })

  it('응답 배열을 그대로 반환한다', async () => {
    const files = [{ fileId: 1, originalName: 'a.png', extension: 'png', fileSize: 1024 }]
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: files })

    const result = await getMeetingRoomFiles(3)

    expect(result).toEqual(files)
  })
})
