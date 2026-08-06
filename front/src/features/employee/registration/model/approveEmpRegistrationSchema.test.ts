import { describe, expect, it } from 'vitest'
import { approveEmpRegistrationSchema } from './approveEmpRegistrationSchema'

describe('approveEmpRegistrationSchema - 성공', () => {
  it('yyyy-MM-dd 형식이 유효하면 통과한다', () => {
    const result = approveEmpRegistrationSchema.safeParse({ hiredAt: '2026-01-01' })
    expect(result.success).toBe(true)
  })

  it('윤년의 2월 29일처럼 유효한 경계값도 통과한다', () => {
    const result = approveEmpRegistrationSchema.safeParse({ hiredAt: '2024-02-29' })
    expect(result.success).toBe(true)
  })
})

describe('approveEmpRegistrationSchema - hiredAt', () => {
  it('빈 문자열이면 실패한다', () => {
    const result = approveEmpRegistrationSchema.safeParse({ hiredAt: '' })
    expect(result.success).toBe(false)
  })

  it('yyyy-MM-dd 형식이 아니면 실패한다', () => {
    const result = approveEmpRegistrationSchema.safeParse({ hiredAt: '2026/01/01' })
    expect(result.success).toBe(false)
  })

  it('존재하지 않는 날짜면 실패한다', () => {
    const result = approveEmpRegistrationSchema.safeParse({ hiredAt: '2024-02-30' })
    expect(result.success).toBe(false)
  })
})
