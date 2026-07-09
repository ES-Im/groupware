import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import { deriveTodayAttendanceButtonState } from './deriveTodayAttendanceButtonState'
import type { AttendanceItem } from '@/features/attendance/model/attendance'

/**
 * deriveTodayAttendanceButtonState(ROADMAP2.md M2 T2.1, F301/F302 · Open Question #3) 단위 테스트.
 * "오늘"은 dayjs().format('YYYY-MM-DD')로 매 실행 시 구해 픽스처에 사용한다(하드코딩 금지 —
 * 시스템 날짜와 무관하게 항상 통과해야 한다).
 */

const today = dayjs().format('YYYY-MM-DD')
const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD')

function makeItem(overrides: Partial<AttendanceItem>): AttendanceItem {
  return {
    attendanceId: 1,
    attendanceStatus: 'NORMAL',
    attendanceDate: today,
    startAt: null,
    endAt: null,
    isApproved: false,
    draftId: null,
    ...overrides,
  }
}

describe('deriveTodayAttendanceButtonState', () => {
  it('오늘 레코드가 없으면 출근 가능/퇴근 불가를 반환한다', () => {
    const monthlyList: AttendanceItem[] = [
      makeItem({ attendanceId: 1, attendanceDate: yesterday, startAt: '09:00:00', endAt: '18:00:00' }),
    ]

    expect(deriveTodayAttendanceButtonState(monthlyList)).toEqual({
      canCheckIn: true,
      canCheckOut: false,
    })
  })

  it('오늘 레코드가 있고 출근만 한 경우(startAt 있음, endAt 없음) 출근 불가/퇴근 가능을 반환한다', () => {
    const monthlyList: AttendanceItem[] = [
      makeItem({ attendanceId: 1, startAt: '09:00:00', endAt: null }),
    ]

    expect(deriveTodayAttendanceButtonState(monthlyList)).toEqual({
      canCheckIn: false,
      canCheckOut: true,
    })
  })

  it('오늘 레코드가 출퇴근 완료(startAt·endAt 모두 있음)면 출근 불가/퇴근 불가를 반환한다', () => {
    const monthlyList: AttendanceItem[] = [
      makeItem({ attendanceId: 1, startAt: '09:00:00', endAt: '18:00:00' }),
    ]

    expect(deriveTodayAttendanceButtonState(monthlyList)).toEqual({
      canCheckIn: false,
      canCheckOut: false,
    })
  })

  it('과거 날짜 레코드가 섞여 있어도 오늘 레코드만 보고 판정한다(과거 미완료 레코드는 무시)', () => {
    const monthlyList: AttendanceItem[] = [
      makeItem({ attendanceId: 1, attendanceDate: yesterday, startAt: '09:00:00', endAt: null }),
      makeItem({ attendanceId: 2, attendanceDate: today, startAt: '09:00:00', endAt: '18:00:00' }),
    ]

    expect(deriveTodayAttendanceButtonState(monthlyList)).toEqual({
      canCheckIn: false,
      canCheckOut: false,
    })
  })

  describe('하루 최대 2건(반차 분할) 엣지케이스', () => {
    it('[완료, 열림] 순서 - 1건 완료(오전 반차 등) + 2번째 건 열림 → 출근 불가/퇴근 가능', () => {
      const monthlyList: AttendanceItem[] = [
        makeItem({
          attendanceId: 1,
          attendanceStatus: 'HALF_DAY_LEAVE',
          startAt: '09:00:00',
          endAt: '13:00:00',
        }),
        makeItem({ attendanceId: 2, attendanceStatus: 'NORMAL', startAt: '14:00:00', endAt: null }),
      ]

      expect(deriveTodayAttendanceButtonState(monthlyList)).toEqual({
        canCheckIn: false,
        canCheckOut: true,
      })
    })

    it('[열림, 완료] 순서로 뒤집어도(배열 순서 무관, 술어 기반 판정) 동일하게 출근 불가/퇴근 가능', () => {
      const monthlyList: AttendanceItem[] = [
        makeItem({ attendanceId: 2, attendanceStatus: 'NORMAL', startAt: '14:00:00', endAt: null }),
        makeItem({
          attendanceId: 1,
          attendanceStatus: 'HALF_DAY_LEAVE',
          startAt: '09:00:00',
          endAt: '13:00:00',
        }),
      ]

      expect(deriveTodayAttendanceButtonState(monthlyList)).toEqual({
        canCheckIn: false,
        canCheckOut: true,
      })
    })

    it('2건 모두 완료(둘 다 startAt·endAt 있음)면 출근 불가/퇴근 불가를 반환한다', () => {
      const monthlyList: AttendanceItem[] = [
        makeItem({
          attendanceId: 1,
          attendanceStatus: 'HALF_DAY_LEAVE',
          startAt: '09:00:00',
          endAt: '13:00:00',
        }),
        makeItem({
          attendanceId: 2,
          attendanceStatus: 'HALF_DAY_LEAVE',
          startAt: '14:00:00',
          endAt: '18:00:00',
        }),
      ]

      expect(deriveTodayAttendanceButtonState(monthlyList)).toEqual({
        canCheckIn: false,
        canCheckOut: false,
      })
    })
  })

  it('시간 없는 휴가성 상태(ALL_DAY_LEAVE, startAt/endAt 모두 null)만 있으면 열린 레코드 없음으로 판정해 둘 다 비활성', () => {
    const monthlyList: AttendanceItem[] = [
      makeItem({ attendanceId: 1, attendanceStatus: 'ALL_DAY_LEAVE', startAt: null, endAt: null }),
    ]

    expect(deriveTodayAttendanceButtonState(monthlyList)).toEqual({
      canCheckIn: false,
      canCheckOut: false,
    })
  })
})
