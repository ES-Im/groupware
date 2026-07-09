import { describe, expect, it } from 'vitest'
import { updateAttendanceSchema } from './updateAttendanceSchema'

/**
 * updateAttendanceSchema(DEPT_ATTENDANCE_UPDATE, ROADMAP T4.1, F307) 단위 테스트.
 * startAt/endAt 둘 다 비어있으면 refine 에러(path: ['startAt'])가 발생하는 경계와,
 * editReason 100자 경계·targetEmpId 타입 검증을 확인한다.
 */

const validBase = {
  targetEmpId: 1,
  editReason: '지각 사유 정정',
}

describe('updateAttendanceSchema', () => {
  it('startAt·endAt이 둘 다 undefined이면 refine 에러가 발생한다', () => {
    const result = updateAttendanceSchema.safeParse({ ...validBase })

    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues[0]
      expect(issue.path).toEqual(['startAt'])
      expect(issue.message).toBe('시작 또는 종료 시각 중 하나는 입력해야 합니다')
    }
  })

  it('startAt·endAt이 둘 다 빈 문자열이면 refine 에러가 발생한다', () => {
    const result = updateAttendanceSchema.safeParse({
      ...validBase,
      startAt: '',
      endAt: '',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues[0]
      expect(issue.path).toEqual(['startAt'])
      expect(issue.message).toBe('시작 또는 종료 시각 중 하나는 입력해야 합니다')
    }
  })

  it('startAt만 값이 있고 endAt이 undefined이면 성공한다', () => {
    const result = updateAttendanceSchema.safeParse({
      ...validBase,
      startAt: '09:00:00',
    })

    expect(result.success).toBe(true)
  })

  it('startAt만 값이 있고 endAt이 빈 문자열이면 성공한다', () => {
    const result = updateAttendanceSchema.safeParse({
      ...validBase,
      startAt: '09:00:00',
      endAt: '',
    })

    expect(result.success).toBe(true)
  })

  it('endAt만 값이 있고 startAt이 undefined이면 성공한다', () => {
    const result = updateAttendanceSchema.safeParse({
      ...validBase,
      endAt: '18:00:00',
    })

    expect(result.success).toBe(true)
  })

  it('endAt만 값이 있고 startAt이 빈 문자열이면 성공한다', () => {
    const result = updateAttendanceSchema.safeParse({
      ...validBase,
      startAt: '',
      endAt: '18:00:00',
    })

    expect(result.success).toBe(true)
  })

  it('startAt·endAt이 둘 다 유효한 값이면 성공한다', () => {
    const result = updateAttendanceSchema.safeParse({
      ...validBase,
      startAt: '09:00:00',
      endAt: '18:00:00',
    })

    expect(result.success).toBe(true)
  })

  it.each(['9:00', '09:00'])('startAt이 HH:mm:ss 형식이 아니면(%s) 실패한다', (invalidStartAt) => {
    const result = updateAttendanceSchema.safeParse({
      ...validBase,
      startAt: invalidStartAt,
    })

    expect(result.success).toBe(false)
  })

  it.each(['9:00', '09:00'])('endAt이 HH:mm:ss 형식이 아니면(%s) 실패한다', (invalidEndAt) => {
    const result = updateAttendanceSchema.safeParse({
      ...validBase,
      endAt: invalidEndAt,
    })

    expect(result.success).toBe(false)
  })

  it('startAt이 "09:00"(초 누락)이면 zod 기본 union 메시지가 아니라 커스텀 정규식 메시지가 노출된다', () => {
    const result = updateAttendanceSchema.safeParse({
      ...validBase,
      startAt: '09:00',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message)
      expect(messages).toContain('시각 형식이 올바르지 않습니다')
      expect(messages).not.toContain('Invalid input')
      const startAtIssue = result.error.issues.find(
        (issue) => issue.path[0] === 'startAt',
      )
      expect(startAtIssue?.message).toBe('시각 형식이 올바르지 않습니다')
    }
  })

  it('endAt이 "18:00"(초 누락)이면 zod 기본 union 메시지가 아니라 커스텀 정규식 메시지가 노출된다', () => {
    const result = updateAttendanceSchema.safeParse({
      ...validBase,
      endAt: '18:00',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message)
      expect(messages).toContain('시각 형식이 올바르지 않습니다')
      expect(messages).not.toContain('Invalid input')
      const endAtIssue = result.error.issues.find((issue) => issue.path[0] === 'endAt')
      expect(endAtIssue?.message).toBe('시각 형식이 올바르지 않습니다')
    }
  })

  it('startAt이 빈 문자열이고 endAt도 없으면 정규식 위반 없이 refine 메시지만 발생한다(필드 refine이 빈 문자열을 통과시키고, object-level refine이 빈 문자열을 falsy로 판정)', () => {
    const result = updateAttendanceSchema.safeParse({
      ...validBase,
      startAt: '',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues).toHaveLength(1)
      const [issue] = result.error.issues
      expect(issue.path).toEqual(['startAt'])
      expect(issue.message).toBe('시작 또는 종료 시각 중 하나는 입력해야 합니다')
      const messages = result.error.issues.map((i) => i.message)
      expect(messages).not.toContain('시각 형식이 올바르지 않습니다')
    }
  })

  it('editReason이 100자를 초과하면 실패한다', () => {
    const result = updateAttendanceSchema.safeParse({
      targetEmpId: 1,
      startAt: '09:00:00',
      editReason: 'a'.repeat(101),
    })

    expect(result.success).toBe(false)
  })

  it('editReason이 정확히 100자이면 성공한다(경계값)', () => {
    const result = updateAttendanceSchema.safeParse({
      targetEmpId: 1,
      startAt: '09:00:00',
      editReason: 'a'.repeat(100),
    })

    expect(result.success).toBe(true)
  })

  it('editReason이 빈 문자열이면 실패한다(필수)', () => {
    const result = updateAttendanceSchema.safeParse({
      targetEmpId: 1,
      startAt: '09:00:00',
      editReason: '',
    })

    expect(result.success).toBe(false)
  })

  it('targetEmpId가 number가 아니면(문자열) 실패한다', () => {
    const result = updateAttendanceSchema.safeParse({
      targetEmpId: '1',
      startAt: '09:00:00',
      editReason: '지각 사유 정정',
    })

    expect(result.success).toBe(false)
  })

  it('정상 케이스: 모든 필드가 유효하면 성공하고 파싱된 값을 그대로 반환한다', () => {
    const input = {
      targetEmpId: 1,
      startAt: '09:00:00',
      endAt: '18:00:00',
      editReason: '지각 사유 정정',
    }

    const result = updateAttendanceSchema.safeParse(input)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(input)
    }
  })
})
