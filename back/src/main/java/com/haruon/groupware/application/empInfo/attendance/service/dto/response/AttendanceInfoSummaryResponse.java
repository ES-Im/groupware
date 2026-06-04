package com.haruon.groupware.application.empInfo.attendance.service.dto.response;

public record AttendanceInfoSummaryResponse(

        Integer approvedAttendanceCount,
        Integer pendingAttendanceCount,
        Integer totalAttendanceCount,
        Integer overtimeMinutes

) {
}
