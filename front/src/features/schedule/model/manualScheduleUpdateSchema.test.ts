import { describe, expect, it } from 'vitest'
import { manualScheduleUpdateSchema } from './manualScheduleUpdateSchema'

describe('manualScheduleUpdateSchema', () => {
  it('빈 객체(아무 필드도 변경하지 않음)는 통과한다', () => {
    expect(manualScheduleUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('title을 빈 문자열로 지우면 에러다(undefined는 통과, 빈 문자열은 실패)', () => {
    const result = manualScheduleUpdateSchema.safeParse({ title: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('일정 제목을 입력해주세요')
    }
  })

  it('title이 공백만이면 에러다', () => {
    const result = manualScheduleUpdateSchema.safeParse({ title: '   ' })
    expect(result.success).toBe(false)
  })

  it('title이 100자를 초과하면 에러다', () => {
    const result = manualScheduleUpdateSchema.safeParse({ title: 'a'.repeat(101) })
    expect(result.success).toBe(false)
  })

  it('content가 공백만이면 에러다', () => {
    const result = manualScheduleUpdateSchema.safeParse({ content: '   ' })
    expect(result.success).toBe(false)
  })

  it('startAt/endAt이 HH:mm 형식이 아니면 각각 에러다', () => {
    expect(manualScheduleUpdateSchema.safeParse({ startAt: '13:00:00' }).success).toBe(false)
    expect(manualScheduleUpdateSchema.safeParse({ endAt: '1:00' }).success).toBe(false)
  })

  it('endAt이 startAt 이하면 endAt 경로에 에러가 붙는다', () => {
    const result = manualScheduleUpdateSchema.safeParse({ startAt: '14:00', endAt: '13:00' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const endAtIssue = result.error.issues.find((issue) => issue.path.join('.') === 'endAt')
      expect(endAtIssue?.message).toBe('종료 시각은 시작 시각보다 이후여야 합니다')
    }
  })

  it('endAt이 startAt과 같으면 endAt 경로에 에러가 붙는다', () => {
    const result = manualScheduleUpdateSchema.safeParse({ startAt: '13:00', endAt: '13:00' })
    expect(result.success).toBe(false)
  })

  it('startAt/endAt이 함께 유효하게 변경되면 통과한다', () => {
    const result = manualScheduleUpdateSchema.safeParse({ startAt: '13:00', endAt: '14:00' })
    expect(result.success).toBe(true)
  })

  it('content만 지정해도 통과한다', () => {
    expect(manualScheduleUpdateSchema.safeParse({ content: '수정된 내용' }).success).toBe(true)
  })
})
