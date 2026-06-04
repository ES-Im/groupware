package com.haruon.groupware.application.empInfo.attendance.service.dto.response.result;

import com.haruon.groupware.application.empInfo.attendance.service.dto.response.AttendanceInfoResponse;
import com.haruon.groupware.application.empInfo.attendance.service.dto.response.AttendanceInfoSummaryResponse;
import com.haruon.groupware.application.empInfo.attendance.service.dto.response.DeptAttendanceEmpInfo;

import java.util.List;

public record DeptAttendanceResponse (
        DeptAttendanceEmpInfo empInfo,
        AttendanceInfoSummaryResponse summary,
        List<AttendanceInfoResponse> attendanceInfo
) {
}
