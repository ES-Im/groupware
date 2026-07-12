import { describe, expect, it } from 'vitest'
import {
  calculateUsedLeaveDays,
  formatLeaveDays,
  isFourHourUnitLeaveType,
} from './leaveHours'

/**
 * lib/leaveHours.ts — 백엔드 `LeaveDraftService.calculateUsedHours` 순방향 미러 검증.
 * 기대값은 백엔드 규칙(근무 09~18시, 하루 8시간, 4시간 초과 구간 휴게 1시간 차감, 멀티데이 =
 * 시작일(시작~18) + 중간일×8 + 종료일(09~종료))을 수기로 계산해 대조한 값이다. 폼의 시각
 * 옵션은 반차 경계(시작 09/13, 종료 13/18)라 결과는 항상 0.5일 배수다.
 */
describe('calculateUsedLeaveDays', () => {
  it('같은 날 09~13(오전 반차)은 0.5일이다', () => {
    expect(calculateUsedLeaveDays('2026-07-13', '09', '2026-07-13', '13')).toBe(0.5)
  })

  it('같은 날 13~18(오후 반차)은 raw 5시간에서 휴게 1시간을 차감해 0.5일이다', () => {
    expect(calculateUsedLeaveDays('2026-07-13', '13', '2026-07-13', '18')).toBe(0.5)
  })

  it('같은 날 09~18(종일)은 1.0일이다(9시간 - 휴게 1시간 = 8시간)', () => {
    expect(calculateUsedLeaveDays('2026-07-13', '09', '2026-07-13', '18')).toBe(1)
  })

  it('09시 시작 ~ 다음 날 13시 종료는 1.5일이다(8시간 + 4시간)', () => {
    expect(calculateUsedLeaveDays('2026-07-13', '09', '2026-07-14', '13')).toBe(1.5)
  })

  it('13시 시작 ~ 다음 날 18시 종료는 1.5일이다(4시간 + 8시간)', () => {
    expect(calculateUsedLeaveDays('2026-07-13', '13', '2026-07-14', '18')).toBe(1.5)
  })

  it('09시 시작 ~ 이틀 뒤 18시 종료는 3.0일이다(8+8+8시간, 달력일 기준)', () => {
    expect(calculateUsedLeaveDays('2026-07-13', '09', '2026-07-15', '18')).toBe(3)
  })

  it('종료가 시작보다 빠르거나 같은 일시면 null이다', () => {
    expect(calculateUsedLeaveDays('2026-07-13', '13', '2026-07-13', '13')).toBeNull()
    expect(calculateUsedLeaveDays('2026-07-14', '09', '2026-07-13', '18')).toBeNull()
  })

  it('미완성 입력(빈 값)은 null이다', () => {
    expect(calculateUsedLeaveDays('', '09', '2026-07-13', '18')).toBeNull()
    expect(calculateUsedLeaveDays('2026-07-13', '09', '2026-07-13', '')).toBeNull()
  })
})

describe('formatLeaveDays', () => {
  it('0.5 단위 고정 소수 1자리로 표시한다("0.5일"/"1.0일"/"3.0일")', () => {
    expect(formatLeaveDays(0.5)).toBe('0.5일')
    expect(formatLeaveDays(1)).toBe('1.0일')
    expect(formatLeaveDays(3)).toBe('3.0일')
  })
})

describe('isFourHourUnitLeaveType', () => {
  it('연차/특별휴가/대체휴무(백엔드 차감형 = 4시간 단위 강제)만 true다', () => {
    expect(isFourHourUnitLeaveType('ANNUAL')).toBe(true)
    expect(isFourHourUnitLeaveType('SPECIAL')).toBe(true)
    expect(isFourHourUnitLeaveType('COMPENSATORY')).toBe(true)
  })

  it('병가/공가(차감·단위 제약 없음)/미선택(undefined)은 false다', () => {
    expect(isFourHourUnitLeaveType('SICK')).toBe(false)
    expect(isFourHourUnitLeaveType('OFFICIAL')).toBe(false)
    expect(isFourHourUnitLeaveType(undefined)).toBe(false)
  })
})
