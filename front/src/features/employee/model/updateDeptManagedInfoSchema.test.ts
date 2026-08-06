import { describe, expect, it } from 'vitest'
import { updateDeptManagedInfoSchema } from './updateDeptManagedInfoSchema'

const validValues = {
  extensionNo: '101-0001',
  systemRoleCode: ['EMPLOYEE'],
}

describe('updateDeptManagedInfoSchema - 성공', () => {
  it('전 필드가 유효하면 통과한다', () => {
    const result = updateDeptManagedInfoSchema.safeParse(validValues)
    expect(result.success).toBe(true)
  })
})

describe('updateDeptManagedInfoSchema - extensionNo', () => {
  it('000-0000 형식이 아니면 실패한다', () => {
    const result = updateDeptManagedInfoSchema.safeParse({ ...validValues, extensionNo: '1010001' })
    expect(result.success).toBe(false)
  })

  it('빈 문자열이면 통과한다(내선번호 변경 안 함)', () => {
    const result = updateDeptManagedInfoSchema.safeParse({ ...validValues, extensionNo: '' })
    expect(result.success).toBe(true)
  })
})

describe('updateDeptManagedInfoSchema - systemRoleCode', () => {
  it('빈 배열이면 실패한다(최소 1개 선택)', () => {
    const result = updateDeptManagedInfoSchema.safeParse({ ...validValues, systemRoleCode: [] })
    expect(result.success).toBe(false)
  })
})
