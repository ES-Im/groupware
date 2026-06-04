package com.haruon.groupware.application.empInfo.attendance.service.dto.response.result;

import com.haruon.groupware.application.empInfo.attendance.service.dto.response.AttendanceInfoResponse;
import com.haruon.groupware.application.empInfo.attendance.service.dto.response.DeptAttendanceEmpInfo;

public record DeptPendingAttendanceResponse(
        DeptAttendanceEmpInfo empInfo,
        AttendanceInfoResponse attendanceInfo
) {
}
