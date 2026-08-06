import type { EventInput } from '@fullcalendar/core'
import type { AttendanceItem } from '../model/attendance'
import { getAttendanceStatusBadge, type AttendanceBadgeVariant } from './attendanceStatusBadge'

const VARIANT_CLASSNAME: Record<AttendanceBadgeVariant, string> = {
  default: 'attendance-event-default',
  secondary: 'attendance-event-secondary',
  destructive: 'attendance-event-destructive',
  outline: 'attendance-event-outline',
}

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
