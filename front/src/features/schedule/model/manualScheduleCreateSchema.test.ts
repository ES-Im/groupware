import { describe, expect, it } from 'vitest'
import { manualScheduleCreateSchema } from './manualScheduleCreateSchema'

function validPayload(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    title: '팀 워크숍',
    content: '분기 워크숍 일정입니다',
    startAt: '2026-07-10T09:00:00',
    endAt: '2026-07-10T18:00:00',
    ...overrides,
  }
}

describe('manualScheduleCreateSchema - title 필수(공백 trim)/100자 이하', () => {
  it('title이 공백만 있으면 실패한다("제목을 입력해주세요")', () => {
    const result = manualScheduleCreateSchema.safeParse(validPayload({ title: '   ' }))
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === 'title')
      expect(issue?.message).toBe('제목을 입력해주세요')
    }
  })

  it('title이 101자면 실패한다("제목은 100자 이하로 입력해주세요")', () => {
    const result = manualScheduleCreateSchema.safeParse(validPayload({ title: 'a'.repeat(101) }))
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === 'title')
      expect(issue?.message).toBe('제목은 100자 이하로 입력해주세요')
    }
  })

  it('title이 100자면 통과한다(경계값)', () => {
    const result = manualScheduleCreateSchema.safeParse(validPayload({ title: 'a'.repeat(100) }))
    expect(result.success).toBe(true)
  })

  it('title이 정상 값이면 trim된 값으로 파싱에 성공한다', () => {
    const result = manualScheduleCreateSchema.safeParse(validPayload({ title: '  팀 워크숍  ' }))
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.title).toBe('팀 워크숍')
    }
  })
})

describe('manualScheduleCreateSchema - content 필수(공백 trim, 길이 제한 없음)', () => {
  it('content가 공백만 있으면 실패한다("내용을 입력해주세요")', () => {
    const result = manualScheduleCreateSchema.safeParse(validPayload({ content: '   ' }))
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === 'content')
      expect(issue?.message).toBe('내용을 입력해주세요')
    }
  })

  it('content가 긴 문자열이어도 통과한다(길이 제한 없음)', () => {
    const result = manualScheduleCreateSchema.safeParse(validPayload({ content: 'a'.repeat(1000) }))
    expect(result.success).toBe(true)
  })
})

describe('manualScheduleCreateSchema - startAt/endAt 필수 + endAt>startAt refine(경계값 불허)', () => {
  it('startAt이 빈 문자열이면 실패한다', () => {
    const result = manualScheduleCreateSchema.safeParse(validPayload({ startAt: '' }))
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === 'startAt')
      expect(issue?.message).toBe('시작 일시를 입력해주세요')
    }
  })

  it('endAt이 빈 문자열이면 실패한다', () => {
    const result = manualScheduleCreateSchema.safeParse(validPayload({ endAt: '' }))
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === 'endAt')
      expect(issue?.message).toBe('종료 일시를 입력해주세요')
    }
  })

  it('endAt < startAt이면 refine에 걸려 실패한다(path: endAt)', () => {
    const result = manualScheduleCreateSchema.safeParse(
      validPayload({ startAt: '2026-07-10T18:00:00', endAt: '2026-07-10T09:00:00' }),
    )
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === 'endAt')
      expect(issue?.message).toBe('종료 일시는 시작 일시 이후여야 합니다')
    }
  })

  it('endAt === startAt(경계값, 같은 시각)이면 실패한다 — 엄격한 "<" 비교', () => {
    const result = manualScheduleCreateSchema.safeParse(
      validPayload({ startAt: '2026-07-10T09:00:00', endAt: '2026-07-10T09:00:00' }),
    )
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === 'endAt')
      expect(issue?.message).toBe('종료 일시는 시작 일시 이후여야 합니다')
    }
  })

  it('endAt > startAt이면 성공한다', () => {
    const result = manualScheduleCreateSchema.safeParse(validPayload())
    expect(result.success).toBe(true)
  })
})
