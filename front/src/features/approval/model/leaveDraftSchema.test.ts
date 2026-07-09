import { describe, expect, it } from 'vitest'
import { leaveDraftSchema, leaveTypeLabels, leaveTypeOptions } from './leaveDraftSchema'

/**
 * leaveDraftSchema(F740 `LEAVE_DRAFT_CREATE(_SUBMISSION)`, ROADMAP(LEAVE) T1.1) 클라 사전검증
 * 단위 테스트. businessTripDraftSchema를 동형 확장한 스키마이므로 검증 축도 동형이다:
 *   - title/content: trim 후 공백만 있으면 실패(min 1).
 *   - leaveType: enum 6종 밖의 값/미선택은 실패.
 *   - endAt >= startAt refine — 출장의 엄격한 `<`와 달리 같은 시각(경계값)도 허용해야 한다.
 */

function validPayload(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    title: '연차 신청',
    content: '개인 사정으로 연차를 신청합니다',
    leaveType: 'ANNUAL',
    startAt: '2026-07-10T09:00',
    endAt: '2026-07-10T18:00',
    ...overrides,
  }
}

describe('leaveDraftSchema - title/content 필수(공백 trim)', () => {
  it('title이 공백만 있으면 실패한다("제목을 입력해주세요")', () => {
    const result = leaveDraftSchema.safeParse(validPayload({ title: '   ' }))
    expect(result.success).toBe(false)
    if (!result.success) {
      const titleIssue = result.error.issues.find((issue) => issue.path[0] === 'title')
      expect(titleIssue?.message).toBe('제목을 입력해주세요')
    }
  })

  it('content가 공백만 있으면 실패한다("본문을 입력해주세요")', () => {
    const result = leaveDraftSchema.safeParse(validPayload({ content: '   ' }))
    expect(result.success).toBe(false)
    if (!result.success) {
      const contentIssue = result.error.issues.find((issue) => issue.path[0] === 'content')
      expect(contentIssue?.message).toBe('본문을 입력해주세요')
    }
  })

  it('title/content가 정상 값이면 trim된 값으로 파싱에 성공한다', () => {
    const result = leaveDraftSchema.safeParse(validPayload({ title: '  연차 신청  ' }))
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.title).toBe('연차 신청')
    }
  })
})

describe('leaveDraftSchema - leaveType enum 검증', () => {
  it('leaveType이 누락되면 실패한다', () => {
    const payload = validPayload()
    delete (payload as Record<string, unknown>).leaveType
    const result = leaveDraftSchema.safeParse(payload)
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === 'leaveType')
      expect(issue).toBeDefined()
      expect(issue?.message).toBe('휴가 유형을 선택해주세요')
    }
  })

  it('leaveType이 계약에 없는 값이면 실패한다', () => {
    const result = leaveDraftSchema.safeParse(validPayload({ leaveType: 'UNKNOWN_TYPE' }))
    expect(result.success).toBe(false)
  })

  it.each(['ANNUAL', 'HOURLY', 'SICK', 'OFFICIAL', 'COMPENSATORY', 'SPECIAL'])(
    'leaveType=%s(계약 6종)은 통과한다',
    (leaveType) => {
      const result = leaveDraftSchema.safeParse(validPayload({ leaveType }))
      expect(result.success).toBe(true)
    },
  )
})

describe('leaveDraftSchema - startAt/endAt 필수 + endAt>=startAt refine(경계값 허용)', () => {
  it('startAt이 빈 문자열이면 실패한다', () => {
    const result = leaveDraftSchema.safeParse(validPayload({ startAt: '' }))
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === 'startAt')
      expect(issue?.message).toBe('휴가 시작 일시를 입력해주세요')
    }
  })

  it('endAt이 빈 문자열이면 실패한다', () => {
    const result = leaveDraftSchema.safeParse(validPayload({ endAt: '' }))
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === 'endAt')
      expect(issue?.message).toBe('휴가 종료 일시를 입력해주세요')
    }
  })

  it('endAt < startAt이면 refine에 걸려 실패한다(path: endAt)', () => {
    const result = leaveDraftSchema.safeParse(
      validPayload({ startAt: '2026-07-10T18:00', endAt: '2026-07-10T09:00' }),
    )
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === 'endAt')
      expect(issue?.message).toBe('휴가 종료 일시는 시작 일시 이후여야 합니다')
    }
  })

  it('endAt === startAt(경계값, 같은 시각)이면 성공한다 — 출장(businessTripDraftSchema)의 엄격한 "<"와 다른 지점', () => {
    const result = leaveDraftSchema.safeParse(
      validPayload({ startAt: '2026-07-10T09:00', endAt: '2026-07-10T09:00' }),
    )
    expect(result.success).toBe(true)
  })

  it('endAt > startAt이면 성공한다', () => {
    const result = leaveDraftSchema.safeParse(validPayload())
    expect(result.success).toBe(true)
  })
})

describe('leaveTypeLabels / leaveTypeOptions', () => {
  it('enum 6종 코드를 백엔드 LeaveType.java description과 동일한 한글 라벨로 매핑한다', () => {
    expect(leaveTypeLabels).toEqual({
      ANNUAL: '연차',
      HOURLY: '공휴일',
      SICK: '병가',
      OFFICIAL: '공가',
      COMPENSATORY: '대체휴무',
      SPECIAL: '특별휴가',
    })
  })

  it('leaveTypeOptions는 enum 선언 순서를 유지한 {value,label}[] 이다', () => {
    expect(leaveTypeOptions).toEqual([
      { value: 'ANNUAL', label: '연차' },
      { value: 'HOURLY', label: '공휴일' },
      { value: 'SICK', label: '병가' },
      { value: 'OFFICIAL', label: '공가' },
      { value: 'COMPENSATORY', label: '대체휴무' },
      { value: 'SPECIAL', label: '특별휴가' },
    ])
  })
})
