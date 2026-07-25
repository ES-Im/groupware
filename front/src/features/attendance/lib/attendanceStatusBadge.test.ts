import { describe, expect, it } from 'vitest'
import type { AttendanceStatus } from '../model/attendance'
import { attendanceStatusBadgeMap, getAttendanceStatusBadge } from './attendanceStatusBadge'

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

  it('status가 null이면(출근만 하고 아직 퇴근·마감 전) "진행 중"/outline 배지를 반환한다', () => {
    expect(getAttendanceStatusBadge(null)).toEqual({ label: '진행 중', variant: 'outline' })
  })
})
