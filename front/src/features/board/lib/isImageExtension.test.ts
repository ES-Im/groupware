import { describe, expect, it } from 'vitest'
import { isImageExtension } from './isImageExtension'

describe('isImageExtension', () => {
  it.each(['png', 'jpg', 'jpeg', 'gif'])('%s는 이미지 확장자로 판별한다', (ext) => {
    expect(isImageExtension(ext)).toBe(true)
  })

  it.each(['PNG', 'JPG', 'JPEG', 'GIF'])('대소문자와 무관하게 %s를 이미지 확장자로 판별한다', (ext) => {
    expect(isImageExtension(ext)).toBe(true)
  })

  it.each(['pdf', 'docx', 'zip', ''])('%s는 이미지 확장자가 아니다', (ext) => {
    expect(isImageExtension(ext)).toBe(false)
  })
})
