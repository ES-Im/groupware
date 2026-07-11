import { describe, expect, it } from 'vitest'
import { isEducationImageExtension } from './isEducationImageExtension'

/**
 * isEducationImageExtension 단위 테스트(board isImageExtension.test.ts /
 * approval isDraftImageExtension.test.ts 동형 복제).
 * png/jpg/jpeg/gif만 인라인 이미지로 판정하고, 대소문자를 구분하지 않는다.
 */

describe('isEducationImageExtension', () => {
  it.each(['png', 'jpg', 'jpeg', 'gif'])('%s는 이미지 확장자로 판별한다', (ext) => {
    expect(isEducationImageExtension(ext)).toBe(true)
  })

  it.each(['PNG', 'JPG', 'JPEG', 'GIF'])('대소문자와 무관하게 %s를 이미지 확장자로 판별한다', (ext) => {
    expect(isEducationImageExtension(ext)).toBe(true)
  })

  it.each(['pdf', 'docx', 'zip', ''])('%s는 이미지 확장자가 아니다', (ext) => {
    expect(isEducationImageExtension(ext)).toBe(false)
  })
})
