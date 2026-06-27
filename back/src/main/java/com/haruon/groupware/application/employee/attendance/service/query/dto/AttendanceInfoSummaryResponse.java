package com.haruon.groupware.application.employee.attendance.service.query.dto;

public record AttendanceInfoSummaryResponse(

        Integer approvedAttendanceCount,
        Integer pendingAttendanceCount,
        Integer totalAttendanceCount,
        Integer overtimeMinutes

) {
}
