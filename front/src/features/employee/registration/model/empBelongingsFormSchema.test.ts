import { describe, expect, it } from 'vitest'
import { empBelongingsFormSchema } from './empBelongingsFormSchema'

/**
 * empBelongingsFormSchema(HR_UPDATE_EMP_BELONGINGS 클라 사전검증) 엣지케이스 보강.
 *
 * EmpBelongingsAssignmentForm.test.tsx(T3.6)가 이미 폼 통합 시나리오(deptId/position 미선택
 * 동시 실패, 4필드 전체 채움 성공)를 커버하므로 중복 작성하지 않는다. 이 파일은 폼 UI로는
 * 재현되지 않는 스키마 자체의 개별 필드 실패·경계값만 다룬다 —
 * isPrimary는 UI에서 항상 disabled checked(true 고정)라 z.literal(true) 위반 케이스가 폼
 * 테스트로는 재현되지 않고, startAt은 네이티브 date input이라 형식/존재하지 않는 날짜
 * 오류도 폼 테스트로는 재현되지 않는다.
 */

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
