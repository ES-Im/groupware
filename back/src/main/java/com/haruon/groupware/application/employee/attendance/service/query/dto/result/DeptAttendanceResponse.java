package com.haruon.groupware.application.employee.attendance.service.query.dto.result;

import com.haruon.groupware.application.employee.attendance.service.query.dto.AttendanceInfoResponse;
import com.haruon.groupware.application.employee.attendance.service.query.dto.AttendanceInfoSummaryResponse;
import com.haruon.groupware.application.employee.attendance.service.query.dto.DeptAttendanceEmpInfo;

import java.util.List;

public record DeptAttendanceResponse (
        DeptAttendanceEmpInfo empInfo,
        AttendanceInfoSummaryResponse summary,
        List<AttendanceInfoResponse> attendanceInfo
) {
}
