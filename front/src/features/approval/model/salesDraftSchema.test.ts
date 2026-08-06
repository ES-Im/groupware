import { describe, expect, it } from 'vitest'
import { salesDraftSchema } from './salesDraftSchema'

function validPayload(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    title: '7월 매출 보고',
    content: '7월 매출 실적을 보고합니다',
    franchiseId: 1,
    reportMonth: '2026-07',
    salesAmount: 10000000,
    ...overrides,
  }
}

describe('salesDraftSchema - title/content 필수(공백 trim)', () => {
  it('title이 공백만 있으면 실패한다("제목을 입력해주세요")', () => {
    const result = salesDraftSchema.safeParse(validPayload({ title: '   ' }))
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === 'title')
      expect(issue?.message).toBe('제목을 입력해주세요')
    }
  })

  it('content가 공백만 있으면 실패한다("기안 내용을 입력해주세요")', () => {
    const result = salesDraftSchema.safeParse(validPayload({ content: '   ' }))
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === 'content')
      expect(issue?.message).toBe('기안 내용을 입력해주세요')
    }
  })

  it('title/content가 정상 값이면 trim된 값으로 파싱에 성공한다', () => {
    const result = salesDraftSchema.safeParse(validPayload({ title: '  7월 매출 보고  ' }))
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.title).toBe('7월 매출 보고')
    }
  })
})

describe('salesDraftSchema - franchiseId 양의 정수 필수', () => {
  it('franchiseId가 0이면(미선택 기본값) 실패한다("대상 가맹점을 선택해주세요")', () => {
    const result = salesDraftSchema.safeParse(validPayload({ franchiseId: 0 }))
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === 'franchiseId')
      expect(issue?.message).toBe('대상 가맹점을 선택해주세요')
    }
  })

  it('franchiseId가 음수면 실패한다', () => {
    const result = salesDraftSchema.safeParse(validPayload({ franchiseId: -1 }))
    expect(result.success).toBe(false)
  })

  it('franchiseId가 양의 정수면 성공한다', () => {
    const result = salesDraftSchema.safeParse(validPayload({ franchiseId: 5 }))
    expect(result.success).toBe(true)
  })
})

describe('salesDraftSchema - reportMonth yyyy-MM 정규식', () => {
  it.each(['2026-13', '2026-00', '2026-4', '2026/07', '20260-7', ''])(
    'reportMonth=%s는 형식 위반으로 실패한다',
    (reportMonth) => {
      const result = salesDraftSchema.safeParse(validPayload({ reportMonth }))
      expect(result.success).toBe(false)
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path[0] === 'reportMonth')
        expect(issue?.message).toBe('매출 보고월을 선택해주세요')
      }
    },
  )

  it.each(['2026-01', '2026-07', '2026-12'])('reportMonth=%s(유효한 yyyy-MM)는 성공한다', (reportMonth) => {
    const result = salesDraftSchema.safeParse(validPayload({ reportMonth }))
    expect(result.success).toBe(true)
  })
})

describe('salesDraftSchema - salesAmount 양의 정수 필수', () => {
  it('salesAmount가 0이면 실패한다("매출액은 0보다 커야 합니다")', () => {
    const result = salesDraftSchema.safeParse(validPayload({ salesAmount: 0 }))
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === 'salesAmount')
      expect(issue?.message).toBe('매출액은 0보다 커야 합니다')
    }
  })

  it('salesAmount가 음수면 실패한다', () => {
    const result = salesDraftSchema.safeParse(validPayload({ salesAmount: -100 }))
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === 'salesAmount')
      expect(issue?.message).toBe('매출액은 0보다 커야 합니다')
    }
  })

  it('salesAmount가 소수면 실패한다("매출액은 정수로 입력해주세요")', () => {
    const result = salesDraftSchema.safeParse(validPayload({ salesAmount: 100.5 }))
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === 'salesAmount')
      expect(issue?.message).toBe('매출액은 정수로 입력해주세요')
    }
  })

  it('salesAmount가 NaN(빈 입력, input type=number valueAsNumber 방출)이면 "매출액을 입력해주세요" 에러를 낸다', () => {
    const result = salesDraftSchema.safeParse(validPayload({ salesAmount: Number.NaN }))
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === 'salesAmount')
      expect(issue?.message).toBe('매출액을 입력해주세요')
    }
  })

  it('salesAmount가 숫자가 아니면(문자열) "숫자를 입력해주세요" 에러를 낸다', () => {
    const result = salesDraftSchema.safeParse(validPayload({ salesAmount: '십만원' }))
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === 'salesAmount')
      expect(issue?.message).toBe('숫자를 입력해주세요')
    }
  })

  it('salesAmount가 양의 정수면 성공한다', () => {
    const result = salesDraftSchema.safeParse(validPayload({ salesAmount: 12345 }))
    expect(result.success).toBe(true)
  })
})

describe('salesDraftSchema - 유효 입력 통과', () => {
  it('모든 필드가 유효하면 통과하고 파싱된 값을 그대로 반환한다', () => {
    const result = salesDraftSchema.safeParse(validPayload())
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({
        title: '7월 매출 보고',
        content: '7월 매출 실적을 보고합니다',
        franchiseId: 1,
        reportMonth: '2026-07',
        salesAmount: 10000000,
      })
    }
  })
})
