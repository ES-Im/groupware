import { describe, expect, it } from 'vitest'
import { empBelongingsFormSchema } from './empBelongingsFormSchema'

const validValues = {
  deptId: '2',
  position: 'STAFF',
  isPrimary: true as const,
  startAt: '2026-01-01',
}

describe('empBelongingsFormSchema - 성공', () => {
  it('전 필드가 유효하면 통과한다', () => {
    const result = empBelongingsFormSchema.safeParse(validValues)
    expect(result.success).toBe(true)
  })

  it('startAt이 윤년의 2월 29일처럼 유효한 경계값이어도 통과한다', () => {
    const result = empBelongingsFormSchema.safeParse({ ...validValues, startAt: '2024-02-29' })
    expect(result.success).toBe(true)
  })
})

describe('empBelongingsFormSchema - deptId', () => {
  it('빈 문자열이면 실패한다', () => {
    const result = empBelongingsFormSchema.safeParse({ ...validValues, deptId: '' })
    expect(result.success).toBe(false)
  })
})

describe('empBelongingsFormSchema - position', () => {
  it('빈 문자열이면 실패한다', () => {
    const result = empBelongingsFormSchema.safeParse({ ...validValues, position: '' })
    expect(result.success).toBe(false)
  })
})

describe('empBelongingsFormSchema - isPrimary', () => {
  it('false면 실패한다(신규 등록은 항상 주요 소속이어야 함)', () => {
    const result = empBelongingsFormSchema.safeParse({ ...validValues, isPrimary: false })
    expect(result.success).toBe(false)
  })

  it('누락되면 실패한다', () => {
    const { isPrimary: _isPrimary, ...rest } = validValues
    const result = empBelongingsFormSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })
})

describe('empBelongingsFormSchema - startAt', () => {
  it('빈 문자열이면 실패한다', () => {
    const result = empBelongingsFormSchema.safeParse({ ...validValues, startAt: '' })
    expect(result.success).toBe(false)
  })

  it('yyyy-MM-dd 형식이 아니면 실패한다', () => {
    const result = empBelongingsFormSchema.safeParse({ ...validValues, startAt: '2026/01/01' })
    expect(result.success).toBe(false)
  })

  it('존재하지 않는 날짜면 실패한다', () => {
    const result = empBelongingsFormSchema.safeParse({ ...validValues, startAt: '2024-02-30' })
    expect(result.success).toBe(false)
  })
})
