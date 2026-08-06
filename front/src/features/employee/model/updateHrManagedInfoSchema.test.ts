import { describe, expect, it } from 'vitest'
import { updateHrManagedInfoSchema } from './updateHrManagedInfoSchema'

const validValues = {
  empName: '홍길동',
  password: 'abc12345!',
  extensionNo: '101-0001',
  systemRoleCode: ['EMPLOYEE'],
  hireAt: '2024-01-01',
}

describe('updateHrManagedInfoSchema - 성공', () => {
  it('전 필드가 유효하면 통과한다', () => {
    const result = updateHrManagedInfoSchema.safeParse(validValues)
    expect(result.success).toBe(true)
  })
})

describe('updateHrManagedInfoSchema - empName', () => {
  it('빈 문자열이면 실패한다', () => {
    const result = updateHrManagedInfoSchema.safeParse({ ...validValues, empName: '' })
    expect(result.success).toBe(false)
  })

  it('20자를 초과하면 실패한다', () => {
    const result = updateHrManagedInfoSchema.safeParse({ ...validValues, empName: '가'.repeat(21) })
    expect(result.success).toBe(false)
  })
})

describe('updateHrManagedInfoSchema - password', () => {
  it('8자 미만이면 실패한다', () => {
    const result = updateHrManagedInfoSchema.safeParse({ ...validValues, password: 'ab1!' })
    expect(result.success).toBe(false)
  })

  it('영문이 없으면 실패한다', () => {
    const result = updateHrManagedInfoSchema.safeParse({ ...validValues, password: '12345678!' })
    expect(result.success).toBe(false)
  })

  it('숫자가 없으면 실패한다', () => {
    const result = updateHrManagedInfoSchema.safeParse({ ...validValues, password: 'abcdefgh!' })
    expect(result.success).toBe(false)
  })

  it('특수문자가 없으면 실패한다', () => {
    const result = updateHrManagedInfoSchema.safeParse({ ...validValues, password: 'abcd1234' })
    expect(result.success).toBe(false)
  })

  it('빈 문자열이면 통과한다(비밀번호 변경 안 함)', () => {
    const result = updateHrManagedInfoSchema.safeParse({ ...validValues, password: '' })
    expect(result.success).toBe(true)
  })
})

describe('updateHrManagedInfoSchema - extensionNo', () => {
  it('000-0000 형식이 아니면 실패한다', () => {
    const result = updateHrManagedInfoSchema.safeParse({ ...validValues, extensionNo: '1010001' })
    expect(result.success).toBe(false)
  })

  it('빈 문자열이면 통과한다(내선번호 변경 안 함)', () => {
    const result = updateHrManagedInfoSchema.safeParse({ ...validValues, extensionNo: '' })
    expect(result.success).toBe(true)
  })
})

describe('updateHrManagedInfoSchema - systemRoleCode', () => {
  it('빈 배열이면 실패한다(최소 1개 선택)', () => {
    const result = updateHrManagedInfoSchema.safeParse({ ...validValues, systemRoleCode: [] })
    expect(result.success).toBe(false)
  })
})

describe('updateHrManagedInfoSchema - hireAt', () => {
  it('yyyy-MM-dd 형식이 아니면 실패한다', () => {
    const result = updateHrManagedInfoSchema.safeParse({ ...validValues, hireAt: '2024/01/01' })
    expect(result.success).toBe(false)
  })

  it('존재하지 않는 날짜면 실패한다', () => {
    const result = updateHrManagedInfoSchema.safeParse({ ...validValues, hireAt: '2024-02-30' })
    expect(result.success).toBe(false)
  })
})
