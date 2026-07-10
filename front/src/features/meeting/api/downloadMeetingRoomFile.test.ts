import { describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { downloadMeetingRoomFile } from './downloadMeetingRoomFile'

/**
 * downloadMeetingRoomFile(F812, ROADMAP T2.4-a) 단위 테스트.
 * board downloadBoardFile과 동형 — blob 조회 후 임시 <a>로 저장을 트리거하고 objectURL을 즉시 revoke한다.
 */
vi.mock('@/shared/api/client', () => ({
  apiClient: { get: vi.fn() },
}))

describe('downloadMeetingRoomFile', () => {
  it('GET /api/meeting-rooms/{meetingRoomId}/files/{fileId}/download를 blob으로 조회한다', async () => {
    const blob = new Blob(['data'])
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: blob })
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    await downloadMeetingRoomFile(3, 10, 'a.png')

    expect(apiClient.get).toHaveBeenCalledWith('/api/meeting-rooms/3/files/10/download', {
      responseType: 'blob',
    })
  })

  it('다운로드 트리거 직후 objectURL을 revoke한다(메모리 누수 방지)', async () => {
    const blob = new Blob(['data'])
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: blob })
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url')
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    await downloadMeetingRoomFile(3, 10, 'a.png')

    expect(revokeSpy).toHaveBeenCalledWith('blob:mock-url')
  })

  it('실패 시 예외를 그대로 던진다(호출부 위임)', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('network error'))

    await expect(downloadMeetingRoomFile(3, 10, 'a.png')).rejects.toThrow('network error')
  })
})
