import { describe, expect, it } from 'vitest'
import { isDraftImageExtension } from './isDraftImageExtension'

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
