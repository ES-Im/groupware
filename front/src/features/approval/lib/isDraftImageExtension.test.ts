import { describe, expect, it } from 'vitest'
import { isDraftImageExtension } from './isDraftImageExtension'

/**
 * isDraftImageExtension(ROADMAP(DRAFT) T6.2) 단위 테스트.
 * png/jpg/jpeg/gif만 인라인 이미지로 판정하고, 대소문자를 구분하지 않는다(toLowerCase).
 * 그 외 확장자(문서/압축 등)는 false → 일반 다운로드 버튼 렌더로 분기된다.
 */

describe('isDraftImageExtension', () => {
  it.each(['png', 'jpg', 'jpeg', 'gif'])('이미지 확장자 %s는 true', (ext) => {
    expect(isDraftImageExtension(ext)).toBe(true)
  })

  it.each(['PNG', 'JPG', 'Jpeg', 'GIF'])('대문자/혼합 대소문자 %s도 true(대소문자 무관)', (ext) => {
    expect(isDraftImageExtension(ext)).toBe(true)
  })

  it.each(['pdf', 'docx', 'zip', 'txt', 'svg', 'webp', 'bmp', ''])(
    '비이미지 확장자 %s는 false',
    (ext) => {
      expect(isDraftImageExtension(ext)).toBe(false)
    },
  )
})
