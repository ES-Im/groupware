import { describe, expect, it } from 'vitest'
import type { ActiveFile } from '@/features/employee/model/me'
import { getActiveProfilePicture, getActiveSignature } from './activeFiles'

function makeFile(overrides: Partial<ActiveFile>): ActiveFile {
  return {
    file: { fileId: 1, originalName: 'a.png', extension: 'png', fileSize: 100 },
    type: 'PROFILE_PICTURE',
    isActive: true,
    ...overrides,
  }
}

describe('getActiveProfilePicture', () => {
  it('활성 PROFILE_PICTURE의 fileId를 반환한다', () => {
    const files = [makeFile({ file: { fileId: 42, originalName: 'p.png', extension: 'png', fileSize: 1 } })]
    expect(getActiveProfilePicture(files)).toBe(42)
  })

  it('PROFILE_PICTURE가 비활성(isActive=false)이면 undefined를 반환한다', () => {
    const files = [makeFile({ isActive: false })]
    expect(getActiveProfilePicture(files)).toBeUndefined()
  })

  it('PROFILE_PICTURE가 없으면(SIGNATURE만 존재) undefined를 반환한다', () => {
    const files = [makeFile({ type: 'SIGNATURE' })]
    expect(getActiveProfilePicture(files)).toBeUndefined()
  })

  it('빈 배열이면 undefined를 반환한다', () => {
    expect(getActiveProfilePicture([])).toBeUndefined()
  })

  it('미지 type 값이 섞여도 크래시 없이 안전하게 무시하고, 활성 PROFILE_PICTURE만 선택한다', () => {
    const files = [
      makeFile({
        type: 'UNKNOWN_FUTURE_TYPE',
        file: { fileId: 1, originalName: 'x', extension: 'x', fileSize: 1 },
      }),
      makeFile({ file: { fileId: 99, originalName: 'p.png', extension: 'png', fileSize: 1 } }),
    ]
    expect(getActiveProfilePicture(files)).toBe(99)
  })
})

describe('getActiveSignature', () => {
  it('활성 SIGNATURE의 fileId를 반환한다', () => {
    const files = [
      makeFile({
        type: 'SIGNATURE',
        file: { fileId: 7, originalName: 's.png', extension: 'png', fileSize: 1 },
      }),
    ]
    expect(getActiveSignature(files)).toBe(7)
  })

  it('SIGNATURE가 비활성(isActive=false)이면 undefined를 반환한다', () => {
    const files = [makeFile({ type: 'SIGNATURE', isActive: false })]
    expect(getActiveSignature(files)).toBeUndefined()
  })

  it('SIGNATURE가 없으면(PROFILE_PICTURE만 존재) undefined를 반환한다', () => {
    const files = [makeFile({ type: 'PROFILE_PICTURE' })]
    expect(getActiveSignature(files)).toBeUndefined()
  })

  it('빈 배열이면 undefined를 반환한다', () => {
    expect(getActiveSignature([])).toBeUndefined()
  })
})
