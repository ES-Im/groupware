import type { EventInput } from '@fullcalendar/core'
import type { AttendanceItem } from '../model/attendance'
import { getAttendanceStatusBadge, type AttendanceBadgeVariant } from './attendanceStatusBadge'

/**
 * 배지 variant별 FullCalendar 이벤트 클래스명. attendanceStatusBadgeMap의 4개 variant
 * (default/secondary/destructive/outline)에 그대로 대응시켜, 표(Badge)와 캘린더(이벤트)가
 * 동일한 색 의미 체계를 공유하게 한다. 실제 색은 attendanceCalendar.css(스코프드)에서 이 클래스로
 * 정의하며 라이트/다크 모두 CSS 변수로 따라온다(mapScheduleToEvents 패턴 복제).
 */
const VARIANT_CLASSNAME: Record<AttendanceBadgeVariant, string> = {
  default: 'attendance-event-default',
  secondary: 'attendance-event-secondary',
  destructive: 'attendance-event-destructive',
  outline: 'attendance-event-outline',
}

/**
 * 선택된 사원의 월별 근태 상세 배열(AttendanceItem[])을 AttendanceCalendar(FullCalendar 래퍼)가
 * 소비하는 EventInput[]으로 매핑한다. 순수 매핑 어댑터(부수효과 없음).
 *
 * 근태는 "그날의 상태"라 시각 표시가 목적이므로 allDay 이벤트로 attendanceDate 하루에 배치하고
 * (startAt/endAt이 null인 상태가 있어 timed 이벤트로 만들지 않는다), 제목은 상태 라벨로 둔다.
 * [수정] 다이얼로그(F307)를 여는 eventClick 소비처가 대상 근태를 복원할 수 있도록 empId/attendanceId/
 * startAt/endAt/isApproved를 extendedProps에 실어 보낸다(색 규칙은 getAttendanceStatusBadge가
 * null 가드까지 포함해 결정).
 */
export function mapAttendanceToEvents(items: AttendanceItem[], empId: number): EventInput[] {
  return items.map((item) => {
    const { label, variant } = getAttendanceStatusBadge(item.attendanceStatus)
    return {
      id: String(item.attendanceId),
      title: label,
      start: item.attendanceDate,
      allDay: true,
      classNames: ['attendance-event', VARIANT_CLASSNAME[variant]],
      extendedProps: {
        targetEmpId: empId,
        attendanceId: item.attendanceId,
        startAt: item.startAt,
        endAt: item.endAt,
        isApproved: item.isApproved,
      },
    }
  })
}
