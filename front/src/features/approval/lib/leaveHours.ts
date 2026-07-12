import dayjs from 'dayjs'
import type { LeaveType } from '../model/leaveDraftSchema'

/**
 * 연가 사용 시간 규칙(백엔드 `LeaveDraftService`/`env.yml` 미러).
 *
 * 근무시간 정책(시작 09시·종료 18시·1일 근무 8시간·휴게 1시간)은 백엔드 yml 전용 설정이라
 * 프론트에서 조회할 API가 없다 — 사용자 승인(2026-07-10) 하에 상수로 동기화한다. 백엔드
 * 정책값이 바뀌면 이 파일만 갱신한다. 최종 판정은 항상 서버(DRAFT_005/008 등).
 */
export const LEAVE_DAY_START_HOUR = 9
export const LEAVE_DAY_END_HOUR = 18
export const LEAVE_WORK_HOURS = 8
export const LEAVE_BREAK_HOURS = 1

/**
 * 4시간 단위 강제 유형 = 차감형(백엔드 `DEDUCTIBLE_LEAVE_TYPES` 실측: ANNUAL/SPECIAL/
 * COMPENSATORY). 이 유형들은 사용 시간이 4시간 단위(`usedHours % 4 == 0`, 위반 시 DRAFT_005
 * "휴가는 4시간 단위로만 사용할 수 있습니다")여야 한다. 병가·공가는 차감이 없어 시간 단위
 * 제약도 없다(1시간 단위 자유).
 */
export const FOUR_HOUR_UNIT_LEAVE_TYPES = [
  'ANNUAL',
  'SPECIAL',
  'COMPENSATORY',
] as const satisfies readonly LeaveType[]

export const LEAVE_HOUR_UNIT = 4

/** 유형이 4시간 단위 강제 유형인지 — 폼의 시각 옵션 제한·사용 일수 계산 분기가 소비한다. */
export function isFourHourUnitLeaveType(leaveType: string | undefined): boolean {
  return (FOUR_HOUR_UNIT_LEAVE_TYPES as readonly string[]).includes(leaveType ?? '')
}

/**
 * 4시간 단위 유형의 시각 옵션(2026-07-11 폼 개편 — 반차 경계만 허용, 사용자 확정):
 * 시작은 09(오전/종일 시작)·13(오후 반차 시작), 종료는 13(오전 반차 종료)·18(종일/오후 종료).
 * 어떤 조합이든 하루 사용분이 4시간(0.5일) 배수가 되어 DRAFT_005를 위반할 수 없다
 * (13~18은 raw 5시간이지만 휴게 1시간 차감으로 4시간 — 백엔드 calculateDailyUsedHours 동일).
 */
export const LEAVE_START_HOUR_OPTIONS = ['09', '13'] as const
export const LEAVE_END_HOUR_OPTIONS = ['13', '18'] as const

/** 하루 구간(raw 시간)의 사용 시간 — 4시간 초과 구간은 휴게 1시간을 차감(백엔드 calculateDailyUsedHours 미러). */
function usedHoursOfRawSpan(rawHours: number): number {
  if (rawHours <= 0) {
    return 0
  }
  return rawHours - (rawHours > 4 ? LEAVE_BREAK_HOURS : 0)
}

/**
 * 시작·종료 일시 → 총 사용 시간(시) 순방향 계산(백엔드 `calculateUsedHours` 미러).
 * 미완성 입력이거나 종료가 시작보다 빠르면(같은 일시 포함) null — 폼은 이때 사용 일수를
 * 표시하지 않는다. 날짜는 달력일 기준(주말·공휴일 개념 없음 — 백엔드 동일): 시작일은
 * 시작 시각~18시, 중간일은 하루 8시간, 종료일은 09시~종료 시각으로 계산한다.
 */
export function calculateUsedLeaveHours(
  startDate: string,
  startHour: string,
  endDate: string,
  endHour: string,
): number | null {
  if (!startDate || !startHour || !endDate || !endHour) {
    return null
  }
  const start = Number(startHour)
  const end = Number(endHour)
  if (endDate < startDate || (endDate === startDate && end <= start)) {
    return null
  }
  if (startDate === endDate) {
    return usedHoursOfRawSpan(end - start)
  }
  const middleDays = dayjs(endDate).diff(dayjs(startDate), 'day') - 1
  return (
    usedHoursOfRawSpan(LEAVE_DAY_END_HOUR - start) +
    middleDays * LEAVE_WORK_HOURS +
    usedHoursOfRawSpan(end - LEAVE_DAY_START_HOUR)
  )
}

/**
 * 시작·종료 일시 → 사용 일수(일, 0.5 단위 — 8시간=1일 환산). 계산 불가면 null.
 * 4시간 단위 유형 폼이 본문 자동 구성("사용 일수: 1.5일")과 잔여 확인에 소비한다.
 */
export function calculateUsedLeaveDays(
  startDate: string,
  startHour: string,
  endDate: string,
  endHour: string,
): number | null {
  const hours = calculateUsedLeaveHours(startDate, startHour, endDate, endHour)
  return hours === null ? null : hours / LEAVE_WORK_HOURS
}

/** 사용 일수 표시 문자열(0.5 단위 고정 소수 1자리 — "0.5일"/"1.0일"/"3.0일"). */
export function formatLeaveDays(days: number): string {
  return `${days.toFixed(1)}일`
}
