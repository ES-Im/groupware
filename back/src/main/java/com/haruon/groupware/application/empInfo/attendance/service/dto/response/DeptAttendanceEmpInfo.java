package com.haruon.groupware.application.empInfo.attendance.service.dto.response;

public record DeptAttendanceEmpInfo(
        Long empId,
        String empNo,
        String empName,
        String deptName,
        String positionName
) {
}
