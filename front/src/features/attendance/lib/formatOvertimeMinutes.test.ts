import { describe, expect, it } from 'vitest'
import { formatOvertimeMinutes } from './formatOvertimeMinutes'

/**
 * formatOvertimeMinutes(ROADMAP2.md M1 T1.3) 단위 테스트.
 * 이번 태스크에서 확정한 표기 가정(0분 단독 표기·60분 미만 분만 표기·60분 이상 "n시간 m분",
 * 분이 0이어도 생략 안 함, 반올림 없음)의 경계값을 검증한다.
 */

describe('formatOvertimeMinutes', () => {
  it('0분이면 "0분"을 반환한다', () => {
    expect(formatOvertimeMinutes(0)).toBe('0분')
  })

  it('1분이면 "1분"을 반환한다', () => {
    expect(formatOvertimeMinutes(1)).toBe('1분')
  })

  it('59분(60분 미만 경계)이면 "59분"을 반환한다', () => {
    expect(formatOvertimeMinutes(59)).toBe('59분')
  })

  it('60분(1시간 경계)이면 분을 생략하지 않고 "1시간 0분"을 반환한다', () => {
    expect(formatOvertimeMinutes(60)).toBe('1시간 0분')
  })

  it('61분이면 "1시간 1분"을 반환한다', () => {
    expect(formatOvertimeMinutes(61)).toBe('1시간 1분')
  })

  it('90분이면 "1시간 30분"을 반환한다', () => {
    expect(formatOvertimeMinutes(90)).toBe('1시간 30분')
  })

  it('120분(정각 2시간)이면 "2시간 0분"을 반환한다', () => {
    expect(formatOvertimeMinutes(120)).toBe('2시간 0분')
  })

  it('125분이면 "2시간 5분"을 반환한다', () => {
    expect(formatOvertimeMinutes(125)).toBe('2시간 5분')
  })

  it('1500분(24시간 초과, 25시간 0분)이면 dur.asHours()로 총 시간을 정확히 반환해 "25시간 0분"이 된다', () => {
    // dur.hours()를 썼다면 24시간마다 day 단위로 롤오버되어 "1시간 0분"이 되어버리는
    // 회귀를 잡기 위한 경계 케이스.
    expect(formatOvertimeMinutes(1500)).toBe('25시간 0분')
  })
})
