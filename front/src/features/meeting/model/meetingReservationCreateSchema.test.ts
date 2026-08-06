import dayjs from 'dayjs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { meetingReservationCreateSchema } from './meetingReservationCreateSchema'

function validValues(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    title: '주간 회의',
    meetingDate: dayjs().add(1, 'day').format('YYYY-MM-DD'),
    startAt: '10:00',
    endAt: '11:00',
    participantIds: [101],
    ...overrides,
  }
}

describe('meetingReservationCreateSchema - 필드 단위 검증', () => {
  it('정상 입력은 통과한다', () => {
    const result = meetingReservationCreateSchema.safeParse(validValues())
    expect(result.success).toBe(true)
  })

  it('title이 빈 문자열이면 에러다', () => {
    const result = meetingReservationCreateSchema.safeParse(validValues({ title: '' }))
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('회의 제목을 입력해주세요')
    }
  })

  it('title이 공백만으로 이루어지면 에러다(trim 후 길이 검사)', () => {
    const result = meetingReservationCreateSchema.safeParse(validValues({ title: '   ' }))
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.message === '회의 제목은 공백만으로 입력할 수 없습니다')).toBe(true)
    }
  })

  it('title이 100자를 초과하면 에러다', () => {
    const result = meetingReservationCreateSchema.safeParse(validValues({ title: 'a'.repeat(101) }))
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.message === '회의 제목은 100자 이하로 입력해주세요')).toBe(true)
    }
  })

  it('participantIds가 빈 배열이면 에러다', () => {
    const result = meetingReservationCreateSchema.safeParse(validValues({ participantIds: [] }))
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.message === '참여자를 최소 1명 선택해주세요')).toBe(true)
    }
  })

  it('endAt이 startAt보다 이전이면 endAt 경로에 에러가 붙는다', () => {
    const result = meetingReservationCreateSchema.safeParse(
      validValues({ startAt: '11:00', endAt: '10:00' }),
    )
    expect(result.success).toBe(false)
    if (!result.success) {
      const endAtIssue = result.error.issues.find((issue) => issue.path.join('.') === 'endAt')
      expect(endAtIssue?.message).toBe('종료 시각은 시작 시각보다 이후여야 합니다')
    }
  })
})

describe('meetingReservationCreateSchema - meetingDate+startAt 조합 vs now 경계', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-10T12:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('당일 예약이라도 startAt이 현재 이후면 통과한다(day-only 비교가 아님)', () => {
    const result = meetingReservationCreateSchema.safeParse(
      validValues({ meetingDate: '2026-07-10', startAt: '12:30', endAt: '13:00' }),
    )
    expect(result.success).toBe(true)
  })

  it('당일 예약인데 startAt이 현재 이전이면 startAt 경로에 에러가 붙는다', () => {
    const result = meetingReservationCreateSchema.safeParse(
      validValues({ meetingDate: '2026-07-10', startAt: '11:30', endAt: '13:00' }),
    )
    expect(result.success).toBe(false)
    if (!result.success) {
      const startAtIssue = result.error.issues.find((issue) => issue.path.join('.') === 'startAt')
      expect(startAtIssue?.message).toBe('회의 시작 시각은 현재 이후여야 합니다')
    }
  })

  it('내일 예약이면 startAt 시각 자체(00:00)가 현재 시각보다 이르더라도 통과한다(day+time 조합 비교)', () => {
    const result = meetingReservationCreateSchema.safeParse(
      validValues({ meetingDate: '2026-07-11', startAt: '00:00', endAt: '01:00' }),
    )
    expect(result.success).toBe(true)
  })

  it('과거 날짜(meetingDate)면 startAt이 어떤 값이든 에러다', () => {
    const result = meetingReservationCreateSchema.safeParse(
      validValues({ meetingDate: '2026-07-09', startAt: '20:00', endAt: '21:00' }),
    )
    expect(result.success).toBe(false)
    if (!result.success) {
      const startAtIssue = result.error.issues.find((issue) => issue.path.join('.') === 'startAt')
      expect(startAtIssue?.message).toBe('회의 시작 시각은 현재 이후여야 합니다')
    }
  })
})
