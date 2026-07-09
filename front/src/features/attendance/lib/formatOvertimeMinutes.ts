import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'

dayjs.extend(duration)

/**
 * MyAttendanceSummary.overtimeMinutes(분 단위 정수) → "n시간 m분" 표기 변환(ROADMAP2.md T1.3).
 * 백엔드 계약(PRD Open Question #4)에 반올림/표기 규칙이 확정되어 있지 않아, 이번 태스크에서
 * 합리적 기본값으로 가정한다(사용자 보고 대상):
 *  - 0분이면 "0분"만 표기(굳이 "0시간 0분"이라 쓰지 않음)
 *  - 60분 미만이면 시간 단위를 생략하고 "m분"만 표기
 *  - 60분 이상이면 "n시간 m분"(분이 0이어도 "n시간"만 쓰지 않고 "n시간 0분"으로 통일 표기)
 *  - 반올림 없음(정수 분 입력을 그대로 시/분으로 분해). 음수 입력은 계약상 없다고 가정(방어 처리 없음).
 */
export function formatOvertimeMinutes(minutes: number): string {
  if (minutes === 0) {
    return '0분'
  }

  const dur = dayjs.duration(minutes, 'minutes')
  const hours = Math.floor(dur.asHours())
  const mins = dur.minutes()

  if (hours === 0) {
    return `${mins}분`
  }

  return `${hours}시간 ${mins}분`
}
