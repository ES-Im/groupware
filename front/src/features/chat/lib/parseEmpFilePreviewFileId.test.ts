import { describe, expect, it } from 'vitest'
import { parseEmpFilePreviewFileId } from './parseEmpFilePreviewFileId'

/**
 * parseEmpFilePreviewFileId(ROADMAP(CHAT) T2.1) 실동작 검증.
 * CHAT_ROOM_DETAIL members[].profileImageUrl(EMP_FILE_PREVIEW 완성 경로)에서 BlobAvatar가
 * 요구하는 fileId만 추출하는 순수 파싱 유틸이므로, 성공/실패 케이스만 단순 검증한다.
 */
describe('parseEmpFilePreviewFileId', () => {
  it('EMP_FILE_PREVIEW 경로에서 fileId를 파싱한다', () => {
    expect(parseEmpFilePreviewFileId('/api/employees/1/files/7/preview')).toBe(7)
  })

  it('null이면 undefined를 반환한다', () => {
    expect(parseEmpFilePreviewFileId(null)).toBeUndefined()
  })

  it('예상 형식과 다른 경로면 undefined를 반환한다', () => {
    expect(parseEmpFilePreviewFileId('/api/boards/1/files/7/preview')).toBeUndefined()
    expect(parseEmpFilePreviewFileId('not-a-url')).toBeUndefined()
  })
})
