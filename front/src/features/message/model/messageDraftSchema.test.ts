import { describe, expect, it } from 'vitest'
import { messageDraftSchema } from './messageDraftSchema'

function validPayload(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    title: '점심 회의 안내',
    content: '오늘 점심 12시에 회의실에서 뵙겠습니다.',
    ...overrides,
  }
}

describe('messageDraftSchema - title 필수(공백 trim) + 50자 상한', () => {
  it('title이 공백만 있으면 실패한다("제목을 입력해주세요")', () => {
    const result = messageDraftSchema.safeParse(validPayload({ title: '   ' }))
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === 'title')
      expect(issue?.message).toBe('제목을 입력해주세요')
    }
  })

  it('title이 빈 문자열이면 실패한다', () => {
    const result = messageDraftSchema.safeParse(validPayload({ title: '' }))
    expect(result.success).toBe(false)
  })

  it('title이 정확히 50자면 통과한다(경계값=허용)', () => {
    const result = messageDraftSchema.safeParse(validPayload({ title: 'a'.repeat(50) }))
    expect(result.success).toBe(true)
  })

  it('title이 51자면 실패한다("제목은 50자 이하로 입력해주세요", 경계값+1)', () => {
    const result = messageDraftSchema.safeParse(validPayload({ title: 'a'.repeat(51) }))
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === 'title')
      expect(issue?.message).toBe('제목은 50자 이하로 입력해주세요')
    }
  })

  it('title 앞뒤 공백은 trim된 값으로 파싱에 성공한다', () => {
    const result = messageDraftSchema.safeParse(validPayload({ title: '  점심 회의 안내  ' }))
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.title).toBe('점심 회의 안내')
    }
  })
})

describe('messageDraftSchema - content 필수(공백 trim, 상한 없음)', () => {
  it('content가 공백만 있으면 실패한다("내용을 입력해주세요")', () => {
    const result = messageDraftSchema.safeParse(validPayload({ content: '   ' }))
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === 'content')
      expect(issue?.message).toBe('내용을 입력해주세요')
    }
  })

  it('content가 빈 문자열이면 실패한다', () => {
    const result = messageDraftSchema.safeParse(validPayload({ content: '' }))
    expect(result.success).toBe(false)
  })

  it('content는 51자를 넘어도 통과한다(title과 달리 상한 없음)', () => {
    const result = messageDraftSchema.safeParse(validPayload({ content: 'a'.repeat(1000) }))
    expect(result.success).toBe(true)
  })

  it('content 앞뒤 공백은 trim된 값으로 파싱에 성공한다', () => {
    const result = messageDraftSchema.safeParse(
      validPayload({ content: '  오늘 점심 12시에 회의실에서 뵙겠습니다.  ' }),
    )
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.content).toBe('오늘 점심 12시에 회의실에서 뵙겠습니다.')
    }
  })
})

describe('messageDraftSchema - 정상 입력', () => {
  it('title/content 모두 정상 값이면 성공한다', () => {
    const result = messageDraftSchema.safeParse(validPayload())
    expect(result.success).toBe(true)
  })
})
