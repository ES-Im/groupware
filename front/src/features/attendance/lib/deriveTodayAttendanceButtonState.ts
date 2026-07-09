import dayjs from 'dayjs'
import type { AttendanceItem } from '@/features/attendance/model/attendance'

export interface TodayAttendanceButtonState {
  canCheckIn: boolean
  canCheckOut: boolean
}

/**
 * 오늘 출근/퇴근 버튼 활성 상태 도출(ROADMAP2.md M2 T2.1, F301/F302 · Open Question #3).
 *
 * 당일 근태 단건 조회 엔드포인트가 없어 T1.4가 이미 가져온 "내 월별 근태 목록"(현재월,
 * `MY_ATTENDANCE_MONTHLY`) 캐시에서 오늘 일자(`attendanceDate`)와 일치하는 레코드만 걸러
 * 파생하는 순수 함수다. 추가 API 호출 없음.
 *
 * 판정 규칙(3가지 개념적 케이스, PRD §페이지별 상세 "내 근태 페이지" 주요기능):
 *  1) 오늘 레코드 없음 → 출근 활성 / 퇴근 비활성.
 *  2) 오늘 레코드 중 "열린"(startAt 있음 · endAt 없음) 레코드가 하나라도 있음
 *     → 출근 비활성 / 퇴근 활성.
 *  3) 그 외(오늘 레코드는 있으나 열린 레코드 없음) → 출근 비활성 / 퇴근 비활성("완료"로 간주).
 *
 * **Open Question #3 가정(하루 최대 2건, 반차 분할 규칙 시 판정 기준)**:
 * "가장 최근 레코드"(배열의 마지막 요소 등 순서 기반)가 아니라 **"startAt은 있고 endAt은 없는
 * 레코드가 존재하는지" 술어(predicate) 기반**으로 판정한다. 이유:
 *  - `MY_ATTENDANCE_MONTHLY` 응답이 하루 2건일 때 배열 정렬 순서(생성순/시간순)를 계약 문서가
 *    보장하지 않는다 — 순서에 의존하면 정렬이 바뀌었을 때 조용히 오판정될 위험이 있다.
 *  - 술어 기반이면 "출근했지만 아직 퇴근 안 한 건"이 정확히 하나 존재할 때만 퇴근 버튼이
 *    켜지므로, 오전 반차(HALF_DAY_LEAVE, startAt/endAt 모두 있음)로 이미 닫힌 1건 + 오후
 *    출근으로 아직 열려 있는 2번째 건이 공존하는 케이스에서도 올바르게 "퇴근 가능"으로 판정된다.
 *  - 오늘 레코드가 있지만 열린 레코드가 하나도 없는 경우(둘 다 시각이 채워짐, 또는 시간 없는
 *    휴가성 상태인 ALL_DAY_LEAVE/SICK_LEAVE/ABSENT만 있는 경우)는 "출근할 필요가 없거나 이미
 *    끝났다"로 보아 둘 다 비활성 처리한다 — 백엔드에 하루 재출근을 금지하는 명시적 규칙 문서가
 *    없어 낙관적으로 열어두기보다 보수적으로 막는 쪽을 택했다(실제 재출근 허용 여부는 서버가
 *    F301 호출 시 최종 판정, 이 함수는 UX 상 버튼 노출만 담당).
 * 이 가정은 UX 확정 전까지의 잠정 구현이며, 확정되면 이 함수만 수정하면 된다(단일 지점).
 */
export function deriveTodayAttendanceButtonState(
  monthlyList: AttendanceItem[],
): TodayAttendanceButtonState {
  const today = dayjs().format('YYYY-MM-DD')
  const todayRecords = monthlyList.filter((item) => item.attendanceDate === today)

  if (todayRecords.length === 0) {
    return { canCheckIn: true, canCheckOut: false }
  }

  const hasOpenRecord = todayRecords.some((record) => record.startAt !== null && record.endAt === null)

  if (hasOpenRecord) {
    return { canCheckIn: false, canCheckOut: true }
  }

  return { canCheckIn: false, canCheckOut: false }
}
