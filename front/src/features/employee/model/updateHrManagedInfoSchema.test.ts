import { describe, expect, it } from 'vitest'
import { updateHrManagedInfoSchema } from './updateHrManagedInfoSchema'

/**
 * updateHrManagedInfoSchema(`HR_UPDATE_EMP_INFO` 클라 사전검증) 검증.
 * 필드 근거: back/build/generated-snippets/HR_UPDATE_EMP_INFO/request-fields.adoc(실측).
 */

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

  // EmpUpdateRequestByHR.java 실측: password는 partial-update 필드라 빈 문자열("변경 안 함")은
  // 통과해야 한다(실사용 검증 중 발견한 UX 결함 수정 — 이전에는 매번 새 비밀번호 입력을 강제했다).
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

  // EmpUpdateRequestByHR.java 실측: extensionNo도 partial-update 필드라 빈 문자열("변경 안 함")은
  // 통과해야 한다(기존 내선번호가 비어있는 사원의 권한만 바꾸려 할 때 강제 입력을 막기 위함).
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
