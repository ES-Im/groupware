package com.haruon.groupware.application.employee.attendance.service.query.dto.result;

import com.haruon.groupware.application.employee.attendance.service.query.dto.AttendanceInfoResponse;
import com.haruon.groupware.application.employee.attendance.service.query.dto.DeptAttendanceEmpInfo;

public record DeptPendingAttendanceResponse(
        DeptAttendanceEmpInfo empInfo,
        AttendanceInfoResponse attendanceInfo
) {
}
