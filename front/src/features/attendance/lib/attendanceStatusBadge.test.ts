import { describe, expect, it } from 'vitest'
import type { AttendanceStatus } from '../model/attendance'
import { attendanceStatusBadgeMap, getAttendanceStatusBadge } from './attendanceStatusBadge'

/**
 * attendanceStatusBadge(ROADMAP2.md M1 T1.3) 단위 테스트.
 * AttendanceStatus 6개 리터럴 전부에 대해 label/variant 매핑이 PRD 가정값과 일치하는지 확인한다.
 */

describe('attendanceStatusBadgeMap / getAttendanceStatusBadge', () => {
  it.each([
    ['NORMAL', '정상', 'default'],
    ['LATE_EARLY', '지각/조퇴', 'destructive'],
    ['HALF_DAY_LEAVE', '반차', 'secondary'],
    ['ALL_DAY_LEAVE', '연차', 'secondary'],
    ['SICK_LEAVE', '병가', 'outline'],
    ['ABSENT', '결근', 'destructive'],
  ] satisfies [AttendanceStatus, string, string][])(
    '%s는 label=%s, variant=%s로 매핑된다',
    (status, label, variant) => {
      expect(attendanceStatusBadgeMap[status]).toEqual({ label, variant })
      expect(getAttendanceStatusBadge(status)).toEqual({ label, variant })
    },
  )

  it('attendanceStatusBadgeMap은 정확히 6개 키만 갖는다', () => {
    expect(Object.keys(attendanceStatusBadgeMap)).toHaveLength(6)
  })
})
