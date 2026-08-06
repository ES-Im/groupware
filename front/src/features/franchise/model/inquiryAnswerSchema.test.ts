import { describe, expect, it } from 'vitest'
import { inquiryAnswerSchema } from './inquiryAnswerSchema'

describe('inquiryAnswerSchema', () => {
  it('빈 문자열이면 실패한다', () => {
    const result = inquiryAnswerSchema.safeParse({ answer: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('답변 내용을 입력해주세요')
    }
  })

  it('공백만으로 이루어지면 실패한다', () => {
    const result = inquiryAnswerSchema.safeParse({ answer: '   ' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('답변은 공백만으로 입력할 수 없습니다')
    }
  })

  it('내용이 있으면 성공한다', () => {
    const result = inquiryAnswerSchema.safeParse({ answer: '환불 처리 완료했습니다' })
    expect(result.success).toBe(true)
  })

  it('answer 필드가 없으면 실패한다', () => {
    const result = inquiryAnswerSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})
