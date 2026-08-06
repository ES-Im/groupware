import { describe, expect, it } from 'vitest'
import { parseEmpFilePreviewFileId } from './parseEmpFilePreviewFileId'

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
