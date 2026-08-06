import { describe, expect, it } from 'vitest'
import { isEducationImageExtension } from './isEducationImageExtension'

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
