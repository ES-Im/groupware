package com.haruon.groupware.application.employee.leave.service.query.dto;

public record LeaveSummaryAndEmpInfoResponse(
        Long empId,
        String empNo,
        String empName,
        String deptName,
        String positionName,

        LeaveSummaryResponse leaveSummary
) {

}
