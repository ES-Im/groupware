package com.haruon.groupware.application.employee.attendance.service.query.dto;

public record DeptAttendanceEmpInfo(
        Long empId,
        String empNo,
        String empName,
        String deptName,
        String positionName
) {
}
