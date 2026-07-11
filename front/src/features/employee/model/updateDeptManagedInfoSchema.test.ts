import { describe, expect, it } from 'vitest'
import { updateDeptManagedInfoSchema } from './updateDeptManagedInfoSchema'

/**
 * updateDeptManagedInfoSchema(`DEPT_MANAGER_UPDATE_EMP_INFO` 클라 사전검증) 검증.
 * 필드 근거: back/build/generated-snippets/DEPT_MANAGER_UPDATE_EMP_INFO/request-fields.adoc(실측).
 */

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

  // EmpUpdateRequestByDeptManager.java 실측: extensionNo는 partial-update 필드라 빈 문자열
  // ("변경 안 함")은 통과해야 한다(실사용 검증 중 발견한 UX 결함 수정 — 이전에는 권한만 바꾸려
  // 해도 내선번호 재입력을 강제했다).
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
