import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { uploadMessageFiles } from './uploadMessageFiles'

/**
 * uploadMessageFiles(F1520, ROADMAP(MESSAGE) T4.3-a) 단위 테스트.
 *
 * approval uploadDraftFile 선례와 동일하게 다중 첨부를 파일별 순차 PATCH로 처리한다(다중 part
 * 일괄 전송 미지원). 핵심 검증 축:
 *   - 파일 개수만큼 PATCH를 순차 호출하고, 매 요청의 FormData가 'file' 단수 필드로 그 파일만 담는다.
 *   - 중간에 하나가 실패하면 그 시점에서 중단하고 에러를 그대로 던진다(이후 파일은 요청되지 않음).
 */

vi.mock('@/shared/api/client', () => ({
  apiClient: { patch: vi.fn() },
}))

function makeFile(name: string): File {
  return new File(['x'], name, { type: 'application/pdf' })
}

describe('uploadMessageFiles', () => {
  beforeEach(() => {
    vi.mocked(apiClient.patch).mockReset()
    vi.mocked(apiClient.patch).mockResolvedValue({ data: undefined })
  })

  it('파일 개수만큼 PATCH /api/messages/{messageId}/files를 순차 호출한다', async () => {
    await uploadMessageFiles(10, [makeFile('a.pdf'), makeFile('b.pdf'), makeFile('c.pdf')])

    expect(apiClient.patch).toHaveBeenCalledTimes(3)
    for (const call of vi.mocked(apiClient.patch).mock.calls) {
      expect(call[0]).toBe('/api/messages/10/files')
    }
  })

  it('각 요청의 FormData는 그 파일 1개만 "file" 필드로 담는다', async () => {
    await uploadMessageFiles(10, [makeFile('a.pdf'), makeFile('b.pdf')])

    const firstBody = vi.mocked(apiClient.patch).mock.calls[0][1] as FormData
    expect(firstBody.get('file')).toBeInstanceOf(File)
    expect((firstBody.get('file') as File).name).toBe('a.pdf')

    const secondBody = vi.mocked(apiClient.patch).mock.calls[1][1] as FormData
    expect((secondBody.get('file') as File).name).toBe('b.pdf')
  })

  it('빈 파일 배열이면 PATCH를 호출하지 않는다', async () => {
    await uploadMessageFiles(10, [])

    expect(apiClient.patch).not.toHaveBeenCalled()
  })

  it('중간 파일 업로드가 실패하면 그 시점에서 중단하고 이후 파일은 요청하지 않는다', async () => {
    vi.mocked(apiClient.patch)
      .mockResolvedValueOnce({ data: undefined }) // a.pdf 성공
      .mockRejectedValueOnce(new Error('network error')) // b.pdf 실패

    await expect(
      uploadMessageFiles(10, [makeFile('a.pdf'), makeFile('b.pdf'), makeFile('c.pdf')]),
    ).rejects.toThrow('network error')

    // a.pdf(성공) + b.pdf(실패) = 2회만 호출되고, c.pdf는 시도되지 않는다.
    expect(apiClient.patch).toHaveBeenCalledTimes(2)
  })
})
