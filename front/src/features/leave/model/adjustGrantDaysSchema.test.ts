import { describe, expect, it } from 'vitest'
import { adjustGrantDaysSchema } from './adjustGrantDaysSchema'

describe('adjustGrantDaysSchema', () => {
  it('양의 정수는 성공한다', () => {
    const result = adjustGrantDaysSchema.safeParse({ plusMinusDays: 2 })
    expect(result.success).toBe(true)
  })

  it('0.5 단위 소수(1.5)는 성공한다', () => {
    const result = adjustGrantDaysSchema.safeParse({ plusMinusDays: 1.5 })
    expect(result.success).toBe(true)
  })

  it('음수(차감, -0.5)는 성공한다', () => {
    const result = adjustGrantDaysSchema.safeParse({ plusMinusDays: -0.5 })
    expect(result.success).toBe(true)
  })

  it('0은 실패한다', () => {
    const result = adjustGrantDaysSchema.safeParse({ plusMinusDays: 0 })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('0이 아닌 값을 입력해주세요(음수는 차감)')
    }
  })

  it('0.5 단위가 아니면(1.3) 실패한다(.int() 강제 아님 — 소수 자체는 허용)', () => {
    const result = adjustGrantDaysSchema.safeParse({ plusMinusDays: 1.3 })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('0.5일 단위로 입력해주세요')
    }
  })

  it('미입력(NaN, 빈 number input)이면 "증감 일수를 입력해주세요" 메시지가 노출된다', () => {
    const result = adjustGrantDaysSchema.safeParse({ plusMinusDays: NaN })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('증감 일수를 입력해주세요')
    }
  })

  it('숫자가 아닌 값(문자열)이면 "숫자를 입력해주세요" 메시지가 노출된다', () => {
    const result = adjustGrantDaysSchema.safeParse({ plusMinusDays: '1.5' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('숫자를 입력해주세요')
    }
  })
})
