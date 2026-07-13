import type { AttendanceItem } from '@/features/attendance/model/attendance'

export interface HeaderAttendanceState {
  canCheckIn: boolean
  canCheckOut: boolean
  checkInTime: string | null
  checkOutTime: string | null
}

/**
 * "HH:mm:ss" 원문에서 표시용 "HH:mm"만 자른다(AttendanceTable.formatTime과 동일 컨벤션).
 */
function formatTime(value: string): string {
  return value.slice(0, 5)
}

/**
 * 헤더 프로필 드롭다운 출퇴근 퀵패널 상태 도출.
 *
 * deriveTodayAttendanceButtonState(내 근태 페이지 전용, "열린 레코드" 술어 기반 정교한 판정)와
 * 달리 헤더 위젯은 더 단순한 UX 규칙을 따른다: 출근은 오늘 레코드가 하나라도 생기면 즉시
 * read-only로 잠그고, 퇴근은 오늘 레코드가 있는 한 재클릭을 막지 않는다(중복 퇴근 허용 여부의
 * 실제 판정은 프론트가 추측하지 않고 useCheckOutMutation의 서버 응답에 위임한다).
 *
 * 하루 2건 이상(반차 분할 등) 공존 가능성을 고려해, 출근 시각은 오늘 레코드 중 가장 이른
 * startAt을, 퇴근 시각은 가장 늦은 endAt을 표시한다.
 */
export function deriveHeaderAttendanceState(monthlyList: AttendanceItem[], today: string): HeaderAttendanceState {
  const todayRecords = monthlyList.filter((item) => item.attendanceDate === today)

  const startTimes = todayRecords
    .map((record) => record.startAt)
    .filter((value): value is string => value !== null)
    .sort()
  const endTimes = todayRecords
    .map((record) => record.endAt)
    .filter((value): value is string => value !== null)
    .sort()

  return {
    canCheckIn: todayRecords.length === 0,
    canCheckOut: todayRecords.length > 0,
    checkInTime: startTimes.length > 0 ? formatTime(startTimes[0]) : null,
    checkOutTime: endTimes.length > 0 ? formatTime(endTimes[endTimes.length - 1]) : null,
  }
}
