import { describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { uploadBoardFile } from './uploadBoardFile'

/**
 * uploadBoardFile(BOARD_FILE_UPLOAD, ROADMAP T13.2) 단위 테스트.
 *
 * apiClient.patch를 직접 모킹해 axios 호출 인자(URL, FormData part명)만 검증한다 — 실제 네트워크
 * 전송/서버측 multipart 재구성을 거치지 않는다. WHY: MSW(node)로 실 네트워크를 왕복시키면 jsdom
 * File과 undici(Node 내장 fetch)의 webidl 브랜드 불일치로 multipart 파싱이 깨지는 테스트 인프라
 * 한계가 있다(boardFileMutations.invalidate.test.tsx 주석 참조) — 이 유닛 테스트는 그 계층을
 * 우회해 "part명이 정확히 단수 file인지"만 신뢰성 있게 확인한다.
 */

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
